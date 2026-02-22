import { isRootWorkspaceId, type WorkspaceIdentity } from "./workspace-identity.js";

export function resolveWorkspace<W extends WorkspaceIdentity>(workspaceInput: string, workspaces: readonly W[]): W {
	const workspace = workspaces.find(({ id, label }) => id === workspaceInput || label === workspaceInput);

	if (!workspace) {
		const available = workspaces.map(({ id, label }) => label || id).join(", ");
		throw new Error(`Workspace "${workspaceInput}" not found. Available workspaces: ${available}`);
	}

	return workspace;
}

export function getWorkspaceById<W extends WorkspaceIdentity>(workspaceId: string, workspaces: readonly W[]): W {
	const workspace = workspaces.find(({ id }) => id === workspaceId);

	if (!workspace) {
		const available = workspaces.map(({ id }) => id).join(", ");
		throw new Error(`Workspace with ID "${workspaceId}" not found. Available IDs: ${available}`);
	}

	return workspace;
}

export function validateWorkspaceLabels(workspaces: readonly WorkspaceIdentity[]): void {
	for (const workspace of workspaces) {
		if (workspace.label === "" && !isRootWorkspaceId(workspace.id)) {
			throw new Error(`Workspace "${workspace.id}" has an empty label. Only the root workspace may have an empty label.`);
		}

		const others = workspaces.filter((other) => other.id !== workspace.id);
		const duplicateLabel = others.find((other) => other.label === workspace.label && workspace.label !== "");

		if (duplicateLabel) {
			throw new Error(`Workspace "${workspace.id}" has label "${workspace.label}" which conflicts with workspace "${duplicateLabel.id}".`);
		}

		const conflictsWithId = others.find((other) => other.id === workspace.label);

		if (conflictsWithId) {
			throw new Error(`Workspace "${workspace.id}" has label "${workspace.label}" which conflicts with the ID of workspace "${conflictsWithId.id}".`);
		}
	}
}
