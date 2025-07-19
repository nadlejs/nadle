import { sortBy } from "lodash-es";
import { type Packages } from "@manypkg/tools";

import { Workspace } from "./workspace.js";
import { AliasResolver } from "./alias-resolver.js";
import { RootWorkspace } from "./root-workspace.js";
import { Messages } from "../../utilities/messages.js";
import { type AliasOption } from "../../options/types.js";
import { DependencyResolver } from "./dependency-resolver/index.js";

export interface Project {
	readonly packageManager: string;
	readonly workspaces: Workspace[];
	readonly currentWorkspaceId: string;
	readonly rootWorkspace: RootWorkspace;
}

export namespace Project {
	export async function create(packages: Packages): Promise<Project> {
		const rootWorkspace = await RootWorkspace.create(packages.rootDir);

		const project = {
			rootWorkspace,
			packageManager: packages.tool.type,
			currentWorkspaceId: rootWorkspace.id,
			workspaces: sortBy(
				packages.packages.map((pkg) => Workspace.create(pkg)),
				["relativePath"]
			)
		};

		return new DependencyResolver().resolve(project);
	}

	export function getAllWorkspaces(project: Project): Workspace[] {
		return [project.rootWorkspace, ...project.workspaces];
	}

	export function getWorkspaceByLabelOrId(project: Project, workspaceInput: string): Workspace {
		const workspace = getAllWorkspaces(project).find(({ id, label }) => id === workspaceInput || label === workspaceInput);

		if (!workspace) {
			throw new Error(
				Messages.WorkspaceNotFound(
					workspaceInput,
					getAllWorkspaces(project)
						.map(({ id, label }) => label || id)
						.join(", ")
				)
			);
		}

		return workspace;
	}

	export function getWorkspaceById(project: Project, workspaceId: string): Workspace {
		const workspace = getAllWorkspaces(project).find(({ id }) => id === workspaceId);

		if (!workspace) {
			throw new Error(
				Messages.WorkspaceIdNotFound(
					workspaceId,
					getAllWorkspaces(project)
						.map(({ id }) => id)
						.join(", ")
				)
			);
		}

		return workspace;
	}

	export function configure(project: Project, aliasOption: AliasOption | undefined): Project {
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
				throw new Error(Messages.EmptyWorkspaceLabel(workspace.id));
			}

			const otherWorkspaces = getOtherWorkspaces(workspace.id);
			const sharedLabelWorkspace = otherWorkspaces.find((otherWorkspace) => otherWorkspace.label === workspace.label);

			if (sharedLabelWorkspace) {
				throw new Error(Messages.DuplicatedWorkspaceLabelWithOtherLabel(workspace.id, workspace.label, sharedLabelWorkspace.id));
			}

			// Check if the label is same as other workspace's id
			const sharedIdWorkspace = otherWorkspaces.find((otherWorkspace) => otherWorkspace.id === workspace.label);

			if (sharedIdWorkspace) {
				throw new Error(Messages.DuplicatedWorkspaceLabelWithOtherId(workspace.id, workspace.label, sharedIdWorkspace.id));
			}
		}
	}
}
