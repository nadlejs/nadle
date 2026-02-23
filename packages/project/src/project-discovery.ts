import Path from "node:path";

import { findUp } from "find-up";
import { findRoot } from "@manypkg/find-root";
import { NpmTool, PnpmTool, YarnTool, type Tool, type Packages } from "@manypkg/tools";

import { type Project } from "./types.js";
import { readJson, isPathExists } from "./fs.js";
import { resolveWorkspaceDependencies } from "./dependency-resolver.js";
import { PACKAGE_JSON, DEFAULT_CONFIG_FILE_NAMES } from "./constants.js";
import { createWorkspace, createRootWorkspace } from "./workspace-factory.js";

const MonorepoDetectors: Tool[] = [PnpmTool, NpmTool, YarnTool];

interface NadlePackageJson {
	readonly nadle?: { root?: true };
}

async function createProject(packages: Packages): Promise<Project> {
	const rootWorkspace = await createRootWorkspace(packages.rootDir);

	const project: Project = {
		rootWorkspace,
		packageManager: packages.tool.type,
		currentWorkspaceId: rootWorkspace.id,
		workspaces: packages.packages.map((pkg) => createWorkspace(pkg)).sort((a, b) => a.relativePath.localeCompare(b.relativePath))
	};

	return resolveWorkspaceDependencies(project);
}

export async function discoverProject(startDir: string): Promise<Project> {
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
		{ cwd: startDir, type: "directory" }
	);

	if (projectDir !== undefined) {
		for (const detector of MonorepoDetectors) {
			if (await detector.isMonorepoRoot(projectDir)) {
				const packages = await detector.getPackages(projectDir);

				return createProject(packages);
			}
		}

		const rootWorkspace = await createRootWorkspace(projectDir);

		return {
			rootWorkspace,
			workspaces: [],
			packageManager: "npm",
			currentWorkspaceId: rootWorkspace.id
		};
	}

	const monorepoRoot = await findRoot(startDir);
	const detector = MonorepoDetectors.find(({ type }) => type === monorepoRoot.tool);

	if (!detector) {
		throw new Error(`Unsupported monorepo tool: ${monorepoRoot.tool}. Supported tools are: ${MonorepoDetectors.map(({ type }) => type).join(", ")}.`);
	}

	return createProject(await detector.getPackages(monorepoRoot.rootDir));
}

export async function locateConfigFiles(project: Project): Promise<Project> {
	const configFileMap: Record<string, string | null> = {};

	for (const workspace of project.workspaces) {
		for (const configFileName of DEFAULT_CONFIG_FILE_NAMES) {
			const configFilePath = Path.resolve(workspace.absolutePath, configFileName);

			if (await isPathExists(configFilePath)) {
				configFileMap[workspace.id] = configFilePath;
			}
		}
	}

	return {
		...project,
		workspaces: project.workspaces.map((workspace) => ({
			...workspace,
			configFilePath: configFileMap[workspace.id] ?? null
		}))
	};
}

export function resolveCurrentWorkspaceId(project: Project, cwd: string): Project {
	let closest: string | undefined;
	let currentWorkspaceId = project.rootWorkspace.id;

	for (const workspace of project.workspaces) {
		const workspacePath = workspace.absolutePath;

		if (cwd.startsWith(workspacePath)) {
			if (!closest || workspacePath.length > closest.length) {
				closest = workspacePath;
				currentWorkspaceId = workspace.id;
			}
		}
	}

	return { ...project, currentWorkspaceId };
}
