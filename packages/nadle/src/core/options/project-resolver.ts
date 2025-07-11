import Path from "node:path";
import Process from "node:process";

import { findUp } from "find-up";
import { findRoot } from "@manypkg/find-root";
import { NpmTool, PnpmTool, YarnTool, type Tool } from "@manypkg/tools";

import type { NadlePackageJson } from "./types.js";
import { Project } from "../models/project/project.js";
import { readJson, isPathExists } from "../utilities/fs.js";
import { RootWorkspace } from "../models/project/root-workspace.js";
import { PACKAGE_JSON, CONFIG_FILE_PATTERN, DEFAULT_CONFIG_FILE_NAMES } from "../utilities/constants.js";

const MonorepoDetectors: Tool[] = [PnpmTool, NpmTool, YarnTool];

type WorkspaceInitializer = (workspaceId: string, configFilePath: string) => Promise<void>;

// eslint-disable-next-line no-restricted-properties
const cwd = Process.cwd();

export class ProjectResolver {
	#project: Project | null = null;

	private get project(): Project {
		if (this.#project === null) {
			throw new Error("Project is not initialized. Please call init() first.");
		}

		return this.#project;
	}

	private set project(updater: (project: Project) => Project) {
		this.#project = updater(this.project);
	}

	public async resolve(onInitWorkspace: WorkspaceInitializer, rootConfigFilePathOption: string | undefined): Promise<Project> {
		await this.initProject();
		await this.initializeRootWorkspace(onInitWorkspace, rootConfigFilePathOption);
		await this.initializeSubWorkspaces(onInitWorkspace);
		this.resolveCurrentWorkspaceId();

		return this.project;
	}

	private async initializeRootWorkspace(onInitWorkspace: WorkspaceInitializer, rootConfigFilePathOption: string | undefined) {
		const rootConfigFilePath = await this.resolveRootWorkspaceConfigFile(rootConfigFilePathOption);

		await onInitWorkspace(RootWorkspace.ID, rootConfigFilePath);

		this.project = (project) => {
			return { ...project, rootWorkspace: { ...project.rootWorkspace, configFilePath: rootConfigFilePath } };
		};
	}

	private async initializeSubWorkspaces(onInitWorkspace: WorkspaceInitializer) {
		const configFileMap: Record<string, string | null> = {};

		for (const workspace of this.project.workspaces) {
			for (const configFileName of DEFAULT_CONFIG_FILE_NAMES) {
				const configFilePath = Path.resolve(workspace.absolutePath, configFileName);

				if (await isPathExists(configFilePath)) {
					configFileMap[workspace.id] = configFilePath;
					await onInitWorkspace(workspace.id, configFilePath);
				}
			}
		}

		this.project = (project) => ({
			...project,
			workspaces: project.workspaces.map((workspace) => ({ ...workspace, configFilePath: configFileMap[workspace.id] ?? null }))
		});
	}

	private async initProject() {
		const projectDir = await findUp(
			async (directory) => {
				const packageJsonPath = Path.join(directory, PACKAGE_JSON);

				if (await isPathExists(packageJsonPath)) {
					const packageJson = await readJson<NadlePackageJson>(packageJsonPath);

					if (packageJson.nadle?.root) {
						return directory;
					}
				}

				return undefined;
			},
			{ cwd, type: "directory" }
		);

		if (projectDir !== undefined) {
			for (const detector of MonorepoDetectors) {
				if (await detector.isMonorepoRoot(projectDir)) {
					const packages = await detector.getPackages(projectDir);

					this.#project = Project.create(packages);

					return;
				}
			}

			const rootWorkspace = RootWorkspace.create(projectDir);
			this.#project = { rootWorkspace, workspaces: [], packageManager: "npm", currentWorkspaceId: rootWorkspace.id };

			return;
		}

		const monorepoRoot = await findRoot(cwd);
		const detector = MonorepoDetectors.find(({ type }) => type === monorepoRoot.tool);

		if (!detector) {
			throw new Error(
				`Unsupported monorepo tool: ${monorepoRoot.tool}. Supported tools are: ${MonorepoDetectors.map(({ type }) => type).join(", ")}.`
			);
		}

		this.#project = Project.create(await detector.getPackages(monorepoRoot.rootDir));
	}

	private async resolveRootWorkspaceConfigFile(rootConfigFilePath: string | undefined): Promise<string> {
		const projectPath = this.project.rootWorkspace.absolutePath;

		if (rootConfigFilePath !== undefined) {
			const resolvedConfigPath = Path.resolve(projectPath, rootConfigFilePath);

			if (!(await isPathExists(resolvedConfigPath))) {
				throw new Error(`Config file not found at ${resolvedConfigPath}. Please check the path.`);
			}

			return resolvedConfigPath;
		}

		const resolveConfigPath = await findUp(DEFAULT_CONFIG_FILE_NAMES, { cwd: projectPath });

		if (!resolveConfigPath) {
			throw new Error(
				`No ${CONFIG_FILE_PATTERN}} found in ${projectPath} directory or parent directories. Please use --config to specify a custom path.`
			);
		}

		return resolveConfigPath;
	}

	private resolveCurrentWorkspaceId() {
		let closest: string | undefined;
		let currentWorkspaceId = this.project.rootWorkspace.id;

		for (const workspace of this.project.workspaces) {
			const workspacePath = workspace.absolutePath;

			if (cwd.startsWith(workspacePath)) {
				if (!closest || workspacePath.length > closest.length) {
					closest = workspacePath;
					currentWorkspaceId = workspace.id;
				}
			}
		}

		this.project = (project) => ({ ...project, currentWorkspaceId });
	}
}
