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

const LockfileToPackageManager: ReadonlyArray<readonly [string, string]> = [
	["pnpm-lock.yaml", "pnpm"],
	["yarn.lock", "yarn"],
	["package-lock.json", "npm"]
];

async function detectPackageManager(projectDir: string): Promise<string> {
	for (const [lockfile, packageManager] of LockfileToPackageManager) {
		if (await isPathExists(Path.join(projectDir, lockfile))) {
			return packageManager;
		}
	}

	return "npm";
}

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

		return createSinglePackageProject(projectDir);
	}

	const monorepo = await findMonorepo(startDir);

	if (monorepo !== undefined) {
		return createProject(await monorepo.detector.getPackages(monorepo.rootDir));
	}

	// No `nadle.root` marker and no recognizable monorepo: fall back to the closest
	// ancestor directory that contains a package.json, treated as a single-package project.
	const packageJsonDir = await findUp(PACKAGE_JSON, { cwd: startDir });

	if (packageJsonDir !== undefined) {
		return createSinglePackageProject(Path.dirname(packageJsonDir));
	}

	throw new Error(
		`Unable to locate a Nadle project root from ${startDir}: no monorepo root, nadle.root marker, or package.json found in any ancestor directory.`
	);
}

async function createSinglePackageProject(projectDir: string): Promise<Project> {
	const rootWorkspace = await createRootWorkspace(projectDir);

	return {
		rootWorkspace,
		workspaces: [],
		currentWorkspaceId: rootWorkspace.id,
		packageManager: await detectPackageManager(projectDir)
	};
}

async function findMonorepo(startDir: string): Promise<{ detector: Tool; rootDir: string } | undefined> {
	let monorepoRoot;

	try {
		monorepoRoot = await findRoot(startDir);
	} catch {
		// @manypkg throws when it cannot find any package.json root; the caller falls back.
		return undefined;
	}

	// `@manypkg` reports a lone package.json as the synthetic `root` tool — not a real
	// monorepo. Treat it like "no monorepo" so the caller takes the single-package fallback.
	if (monorepoRoot.tool === "root") {
		return undefined;
	}

	const detector = MonorepoDetectors.find(({ type }) => type === monorepoRoot.tool);

	if (detector === undefined) {
		throw new Error(`Unsupported monorepo tool: ${monorepoRoot.tool}. Supported tools are: ${MonorepoDetectors.map(({ type }) => type).join(", ")}.`);
	}

	return { detector, rootDir: monorepoRoot.rootDir };
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

	let rootConfigFilePath = project.rootWorkspace.configFilePath;

	if (rootConfigFilePath === "") {
		for (const configFileName of DEFAULT_CONFIG_FILE_NAMES) {
			const candidate = Path.resolve(project.rootWorkspace.absolutePath, configFileName);

			if (await isPathExists(candidate)) {
				rootConfigFilePath = candidate;
				break;
			}
		}
	}

	return {
		...project,
		rootWorkspace: { ...project.rootWorkspace, configFilePath: rootConfigFilePath },
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
