import c from "tinyrainbow";
import { sortBy } from "lodash-es";
import { type Packages } from "@manypkg/tools";

import { DOT } from "../utilities/constants.js";
import { type AliasOption } from "../options/types.js";
import { Workspace, AliasResolver, type RootWorkspace } from "./workspace.js";

export interface Project {
	readonly packageManager: string;
	readonly workspaces: Workspace[];
	readonly rootWorkspace: RootWorkspace;
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

	export function create(packages: Packages): Project {
		return {
			packageManager: packages.tool.type,
			rootWorkspace: createRootWorkspace(packages.rootDir),
			workspaces: sortBy(
				packages.packages.map((workspace) => Workspace.create(workspace)),
				["relativePath"]
			)
		};
	}

	export function createRootWorkspace(rootDir: string): RootWorkspace {
		const relativePath = DOT;

		return {
			relativePath,
			configFilePath: "",
			id: ROOT_WORKSPACE_ID,
			absolutePath: rootDir,
			label: ROOT_WORKSPACE_LABEL
		};
	}

	export function configureAlias(project: Project, aliasOption: AliasOption | undefined): Project {
		const resolveAlias = AliasResolver.create(aliasOption);

		const configuredProject = {
			...project,
			rootWorkspace: { ...project.rootWorkspace, label: resolveAlias(project.rootWorkspace.relativePath) ?? project.rootWorkspace.id },
			workspaces: project.workspaces.map((workspace) => ({ ...workspace, label: resolveAlias(workspace.relativePath) ?? workspace.id }))
		};

		validate(configuredProject);

		return configuredProject;
	}

	export function configureConfigFile(project: Project, rootConfigFilePath: string, configFileMap: Record<string, string | null>): Project {
		return {
			...project,
			rootWorkspace: { ...project.rootWorkspace, configFilePath: rootConfigFilePath },
			workspaces: project.workspaces.map((workspace) => ({
				...workspace,
				configFilePath: configFileMap[workspace.id] ?? null
			}))
		};
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
