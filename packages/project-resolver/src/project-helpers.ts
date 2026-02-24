import {
	type AliasOption,
	createAliasResolver,
	validateWorkspaceLabels,
	resolveWorkspace as kernelResolveWorkspace,
	getWorkspaceById as kernelGetWorkspaceById
} from "@nadle/kernel";

import { type Project, type Workspace } from "./types.js";

export function getAllWorkspaces(project: Project): Workspace[] {
	return [project.rootWorkspace, ...project.workspaces];
}

export function getWorkspaceByLabelOrId(project: Project, workspaceInput: string): Workspace {
	return kernelResolveWorkspace(workspaceInput, getAllWorkspaces(project));
}

export function getWorkspaceById(project: Project, workspaceId: string): Workspace {
	return kernelGetWorkspaceById(workspaceId, getAllWorkspaces(project));
}

export function configureProject(project: Project, aliasOption: AliasOption): Project {
	const resolveAlias = createAliasResolver(aliasOption);

	const configuredProject: Project = {
		...project,
		rootWorkspace: {
			...project.rootWorkspace,
			label: resolveAlias(project.rootWorkspace.relativePath) ?? ""
		},
		workspaces: project.workspaces.map((workspace) => ({
			...workspace,
			label: resolveAlias(workspace.relativePath) ?? workspace.id
		}))
	};

	validateWorkspaceLabels(getAllWorkspaces(configuredProject));

	return configuredProject;
}
