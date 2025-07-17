import c from "tinyrainbow";

import { BaseHandler } from "./base-handler.js";
import { highlight } from "../utilities/utils.js";
import { Project } from "../models/project/project.js";
import { createTree } from "../utilities/create-tree.js";
import { StringBuilder } from "../utilities/string-builder.js";
import { type Workspace } from "../models/project/workspace.js";
import { RootWorkspace } from "../models/project/root-workspace.js";

export class ListWorkspacesHandler extends BaseHandler {
	public readonly name = "listWorkspaces";
	public readonly description = "Lists all available workspaces.";

	public canHandle(): boolean {
		return this.nadle.options.listWorkspaces;
	}

	public handle() {
		const workspaces = Project.getAllWorkspaces(this.nadle.options.project);

		const parentWorkspaceMap = this.computeParentWorkspaceMap(workspaces);
		const childrenWorkspaceMap = Object.fromEntries(
			workspaces.map(({ id }) => [id, workspaces.filter((workspace) => parentWorkspaceMap[workspace.id]?.id === id)])
		);

		this.nadle.logger.log(c.bold("Available workspaces:\n"));

		const tree = createTree<Workspace>(
			this.nadle.options.project.rootWorkspace,
			(workspace) => childrenWorkspaceMap[workspace.id],
			(workspace) =>
				new StringBuilder()
					.add(RootWorkspace.isInstance(workspace) ? "Root workspace" : "Workspace")
					.add(highlight(workspace.id))
					.addIf(workspace.label !== workspace.id && workspace.label !== "", c.dim(`(alias: ${workspace.label})`))
					.build()
		);

		this.nadle.logger.log(tree.join("\n"));
	}

	private computeParentWorkspaceMap(workspaces: Workspace[]): Record<string, Workspace | null> {
		const parentWorkspaceMap: Record<string, Workspace | null> = {};

		for (const childWorkspace of workspaces) {
			if (RootWorkspace.isInstance(childWorkspace)) {
				parentWorkspaceMap[childWorkspace.id] = null;
				continue;
			}

			let currentParent: Workspace | null = null;

			for (const parent of workspaces) {
				if (parent.id === childWorkspace.id || !this.isParentWorkspace(parent, childWorkspace)) {
					continue;
				}

				if (!currentParent || parent.relativePath.length > currentParent.relativePath.length) {
					currentParent = parent;
				}
			}

			parentWorkspaceMap[childWorkspace.id] = currentParent;
		}

		return parentWorkspaceMap;
	}

	private isParentWorkspace(parentWorkspace: Workspace, childWorkspace: Workspace): boolean {
		if (RootWorkspace.isInstance(parentWorkspace)) {
			return true;
		}

		if (parentWorkspace.id === childWorkspace.id) {
			return false;
		}

		return childWorkspace.relativePath.startsWith(`${parentWorkspace.relativePath}/`);
	}
}
