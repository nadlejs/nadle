import { DOT, COLON, SLASH, BACKSLASH, ROOT_WORKSPACE_ID } from "./constants.js";

export interface WorkspaceIdentity {
	readonly id: string;
	readonly label: string;
	readonly relativePath: string;
}

export interface TaskReference {
	readonly taskName: string;
	readonly workspaceInput: string | undefined;
}

export function deriveWorkspaceId(relativePath: string): string {
	if (relativePath === DOT) {
		return ROOT_WORKSPACE_ID;
	}

	return relativePath.replaceAll(BACKSLASH, SLASH).replaceAll(SLASH, COLON);
}

export function isRootWorkspaceId(workspaceId: string): boolean {
	return workspaceId === ROOT_WORKSPACE_ID;
}
