import Path from "node:path";

import c from "tinyrainbow";
import { findUp } from "find-up";
import { sortBy } from "lodash-es";
import { findRoot } from "@manypkg/find-root";
import { NpmTool, PnpmTool, YarnTool, type Tool, type Package, type Packages } from "@manypkg/tools";

import { readJson, isPathExists } from "../utilities/fs.js";
import type { AliasOption, NadlePackageJson } from "./types.js";
import { DOT, COLON, SLASH, BACKSLASH, PACKAGE_JSON } from "../utilities/constants.js";

const MonorepoDetectors: Tool[] = [PnpmTool, NpmTool, YarnTool];

interface Workspace {
	readonly id: string;
	readonly label: string;
	readonly relativePath: string;
	readonly absolutePath: string;
}
export namespace Workspace {
	export function create(pkg: Package, aliasResolver: AliasResolver): Workspace {
		const { relativeDir, dir: absolutePath } = pkg;
		const relativePath = relativeDir.replaceAll(BACKSLASH, SLASH);
		const id = relativePath.replaceAll(SLASH, COLON);

		return { id, absolutePath, relativePath, label: aliasResolver(relativePath) ?? id };
	}

	export function resolve(workspaceLabelOrId: string, workspaces: Workspace[]) {
		const workspace = workspaces.find((ws) => ws.id === workspaceLabelOrId || ws.label === workspaceLabelOrId);

		if (!workspace) {
			throw new Error(
				`Workspace ${c.bold(workspaceLabelOrId)} not found. Available workspaces (including alias): ${workspaces.flatMap((ws) => [c.bold(ws.id), c.bold(ws.label)]).join(", ")}`
			);
		}

		return workspace;
	}
}

type AliasResolver = (workspacePath: string) => string | undefined;
namespace AliasResolver {
	export function create(aliasOption: AliasOption | undefined): AliasResolver {
		if (aliasOption === undefined) {
			return () => undefined;
		}

		if (typeof aliasOption === "function") {
			return aliasOption;
		}

		return (workspacePath) => aliasOption[workspacePath];
	}
}

export interface Project {
	readonly packageManager: string;
	readonly workspaces: Workspace[];
	readonly rootWorkspace: Workspace;
}
export namespace Project {
	export const ROOT_WORKSPACE_ID = "root";
	export const ROOT_WORKSPACE_LABEL = "";

	export function isRootWorkspace(workspaceId: string): boolean {
		return workspaceId === ROOT_WORKSPACE_ID;
	}

	export function getAllWorkspaces(project: Project): Workspace[] {
		return [project.rootWorkspace, ...project.workspaces];
	}

	export function findWorkspace(project: Project, workspaceInput: string): Workspace {
		const workspace = getAllWorkspaces(project).find(({ id, label }) => id === workspaceInput || label === workspaceInput);

		if (!workspace) {
			throw new Error(
				`Workspace ${c.bold(workspaceInput)} not found. Available workspaces: ${getAllWorkspaces(project)
					.map((ws) => c.bold(ws.id))
					.join(", ")}`
			);
		}

		return workspace;
	}

	export function getWorkspaceById(project: Project, workspaceId: string): Workspace {
		const workspace = getAllWorkspaces(project).find(({ id }) => id === workspaceId);

		if (!workspace) {
			throw new Error(
				`Workspace with id ${c.bold(workspaceId)} not found. Available workspaces: ${getAllWorkspaces(project)
					.map((ws) => c.bold(ws.id))
					.join(", ")}`
			);
		}

		return workspace;
	}

	export function create(packages: Packages, aliasResolver: AliasResolver): Project {
		const project = {
			packageManager: packages.tool.type,
			rootWorkspace: createRootWorkspace(packages.rootDir, aliasResolver),
			workspaces: sortBy(
				packages.packages.map((workspace) => Workspace.create(workspace, aliasResolver)),
				["relativePath"]
			)
		};
		validate(project);

		return project;
	}

	function createRootWorkspace(rootDir: string, aliasResolver: AliasResolver): Workspace {
		const relativePath = DOT;

		return { relativePath, id: ROOT_WORKSPACE_ID, absolutePath: rootDir, label: aliasResolver(relativePath) ?? ROOT_WORKSPACE_LABEL };
	}

	export async function resolve(cwd: string, aliasOption: AliasOption | undefined): Promise<Project> {
		const resolveAlias = AliasResolver.create(aliasOption);

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

					return Project.create(packages, resolveAlias);
				}
			}

			return { workspaces: [], packageManager: "npm", rootWorkspace: createRootWorkspace(projectDir, resolveAlias) };
		}

		const monorepoRoot = await findRoot(cwd);
		const detector = MonorepoDetectors.find(({ type }) => type === monorepoRoot.tool);

		if (!detector) {
			throw new Error(
				`Unsupported monorepo tool: ${monorepoRoot.tool}. Supported tools are: ${MonorepoDetectors.map(({ type }) => type).join(", ")}.`
			);
		}

		return Project.create(await detector.getPackages(monorepoRoot.rootDir), resolveAlias);
	}

	function validate(project: Project) {
		const workspaces = Project.getAllWorkspaces(project);
		const getOtherWorkspaces = (workspaceId: string): Workspace[] => workspaces.filter((workspace) => workspace.id !== workspaceId);

		for (const workspace of workspaces) {
			if (workspace.label === "" && !isRootWorkspace(workspace.id)) {
				throw new Error(`Workspace ${workspace.id} alias can not be empty.`);
			}

			const otherWorkspaces = getOtherWorkspaces(workspace.id);
			const sharedLabelWorkspace = otherWorkspaces.find((otherWorkspace) => otherWorkspace.label === workspace.label);

			if (sharedLabelWorkspace) {
				throw new Error(
					`Workspace ${c.yellow(workspace.id)} has a duplicated label ${c.yellow(workspace.label)} with workspace ${c.yellow(sharedLabelWorkspace.id)}. Please check the alias configuration in the configuration file.`
				);
			}

			// Check if the label is same as other workspace's id
			const sharedIdWorkspace = otherWorkspaces.find((otherWorkspace) => otherWorkspace.id === workspace.label);

			if (sharedIdWorkspace) {
				throw new Error(
					`Workspace ${c.yellow(workspace.id)} has a label ${c.yellow(workspace.label)} that is the same as workspace ${sharedIdWorkspace.id}'s id. Please check the alias configuration in the configuration file.`
				);
			}
		}
	}
}
