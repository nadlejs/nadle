import c from "tinyrainbow";
import { sortBy } from "lodash-es";
import { type Packages } from "@manypkg/tools";

import { Workspace } from "./workspace.js";
import { AliasResolver } from "./alias-resolver.js";
import { RootWorkspace } from "./root-workspace.js";
import { type AliasOption } from "../options/types.js";

export interface Project {
	readonly packageManager: string;
	readonly workspaces: Workspace[];
	readonly currentWorkspaceId: string;
	readonly rootWorkspace: RootWorkspace;
}

export namespace Project {
	export function create(packages: Packages): Project {
		const rootWorkspace = RootWorkspace.create(packages.rootDir);

		return {
			rootWorkspace,
			packageManager: packages.tool.type,
			currentWorkspaceId: rootWorkspace.id,
			workspaces: sortBy(
				packages.packages.map((pkg) => Workspace.create(pkg)),
				["relativePath"]
			)
		};
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

	export function configureAlias(project: Project, aliasOption: AliasOption | undefined): Project {
		const resolveAlias = AliasResolver.create(aliasOption);

		const configuredProject = {
			...project,
			// Fallback to empty string so its own task names can be displayed without workspace prefix
			rootWorkspace: { ...project.rootWorkspace, label: resolveAlias(project.rootWorkspace.relativePath) ?? "" },
			workspaces: project.workspaces.map((workspace) => ({ ...workspace, label: resolveAlias(workspace.relativePath) ?? workspace.id }))
		};

		validate(configuredProject);

		return configuredProject;
	}

	function validate(project: Project) {
		const workspaces = Project.getAllWorkspaces(project);
		const getOtherWorkspaces = (workspaceId: string): Workspace[] => workspaces.filter((workspace) => workspace.id !== workspaceId);

		for (const workspace of workspaces) {
			if (workspace.label === "" && !RootWorkspace.isRootWorkspaceId(workspace.id)) {
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
