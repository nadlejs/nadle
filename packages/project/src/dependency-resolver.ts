import { getWorkspaceById as kernelGetWorkspaceById } from "@nadle/kernel";

import { getAllWorkspaces } from "./project-helpers.js";
import { type Project, type Workspace } from "./types.js";

export function resolveWorkspaceDependencies(project: Project): Project {
	switch (project.packageManager) {
		case "npm":
			return resolveNpmDependencies(project);
		case "pnpm":
		case "yarn":
			return resolvePnpmYarnDependencies(project);
		default:
			throw new Error(`Unsupported package manager: ${project.packageManager}`);
	}
}

function resolveNpmDependencies(project: Project): Project {
	const packageNameToWorkspaceIdMap: Record<string, string | undefined> = Object.fromEntries(
		project.workspaces.map((workspace) => [workspace.packageJson.name, workspace.id])
	);

	const allWorkspaces = getAllWorkspaces(project);
	const getPackageVersion = (workspaceId: string) => {
		return kernelGetWorkspaceById(workspaceId, allWorkspaces).packageJson.version;
	};

	return {
		...project,
		workspaces: project.workspaces.map((workspace) => ({
			...workspace,
			dependencies: uniqueStrings(
				allDependencyEntries(workspace).flatMap(([dependencyName, dependencyVersion]) => {
					const workspaceId = packageNameToWorkspaceIdMap[dependencyName];

					if (!workspaceId) {
						return [];
					}

					if (dependencyVersion === "*") {
						return [workspaceId];
					}

					if (cleanVersionPrefix(dependencyVersion) === getPackageVersion(workspaceId)) {
						return [workspaceId];
					}

					return [];
				})
			)
		}))
	};
}

function resolvePnpmYarnDependencies(project: Project): Project {
	const workspaceNameToIdMap: Record<string, string | undefined> = Object.fromEntries(
		project.workspaces.map((workspace) => [workspace.packageJson.name, workspace.id])
	);

	return {
		...project,
		workspaces: project.workspaces.map((workspace) => ({
			...workspace,
			dependencies: uniqueStrings(
				allDependencyEntries(workspace).flatMap(([packageName, packageVersion]) => {
					const workspaceId = workspaceNameToIdMap[packageName];

					if (packageVersion.startsWith("workspace:") && workspaceId) {
						return workspaceId;
					}

					return [];
				})
			)
		}))
	};
}

function allDependencyEntries(workspace: Workspace): [string, string][] {
	return [...Object.entries(workspace.packageJson.dependencies ?? {}), ...Object.entries(workspace.packageJson.devDependencies ?? {})];
}

function cleanVersionPrefix(version: string): string {
	return version.replace(/^[~^]/, "");
}

function uniqueStrings(values: string[]): string[] {
	return [...new Set(values)];
}
