import Path from "node:path";

import { findUp } from "find-up";
import { findRoot } from "@manypkg/find-root";
import { NpmTool, PnpmTool, YarnTool, type Tool } from "@manypkg/tools";

import { Project } from "./project.js";
import type { NadlePackageJson } from "./types.js";
import { readJson, isPathExists } from "../utilities/fs.js";
import { PACKAGE_JSON, CONFIG_FILE_PATTERN, DEFAULT_CONFIG_FILE_NAMES } from "../utilities/constants.js";

const MonorepoDetectors: Tool[] = [PnpmTool, NpmTool, YarnTool];

export class ProjectResolver {
	#project: Project | null = null;

	private get project(): Project {
		if (this.#project === null) {
			throw new Error("Project is not initialized. Please call init() first.");
		}

		return this.#project;
	}

	public async resolve(
		cwd: string,
		configFileOptions: string | undefined,
		onInitializeWorkspace: (workspaceId: string, configFilePath: string) => Promise<void>
	): Promise<Project> {
		await this.init(cwd);

		const rootConfigFile = await this.resolveRootConfigFile(configFileOptions);
		const configFileMap: Record<string, string | null> = {};

		await onInitializeWorkspace(Project.ROOT_WORKSPACE_ID, rootConfigFile);

		for (const workspace of this.project.workspaces) {
			const configPath = await this.resolveWorkspaceConfigFile(workspace.absolutePath);

			if (configPath === null) {
				continue;
			}

			configFileMap[workspace.id] = configPath;

			await onInitializeWorkspace(workspace.id, configPath);
		}

		this.#project = Project.configureConfigFile(this.project, rootConfigFile, configFileMap);

		return this.project;
	}

	public async init(cwd: string): Promise<this> {
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

					return this;
				}
			}

			this.#project = { workspaces: [], packageManager: "npm", rootWorkspace: Project.createRootWorkspace(projectDir) };

			return this;
		}

		const monorepoRoot = await findRoot(cwd);
		const detector = MonorepoDetectors.find(({ type }) => type === monorepoRoot.tool);

		if (!detector) {
			throw new Error(
				`Unsupported monorepo tool: ${monorepoRoot.tool}. Supported tools are: ${MonorepoDetectors.map(({ type }) => type).join(", ")}.`
			);
		}

		this.#project = Project.create(await detector.getPackages(monorepoRoot.rootDir));

		return this;
	}

	private async resolveRootConfigFile(configPath: string | undefined): Promise<string> {
		const projectPath = this.project.rootWorkspace.absolutePath;

		if (configPath !== undefined) {
			const resolvedConfigPath = Path.resolve(projectPath, configPath);

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

	private async resolveWorkspaceConfigFile(workspacePath: string): Promise<string | null> {
		for (const configFileName of DEFAULT_CONFIG_FILE_NAMES) {
			// TODO: Support customized config file path?
			const configFilePath = Path.resolve(workspacePath, configFileName);

			if (await isPathExists(configFilePath)) {
				return configFilePath;
			}
		}

		return null;
	}
}
