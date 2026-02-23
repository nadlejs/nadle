import { COLON } from "./constants.js";
import type { TaskReference } from "./workspace-identity.js";

export function parseTaskReference(input: string): TaskReference {
	if (!input.includes(COLON)) {
		return { taskName: input, workspaceInput: undefined };
	}

	const parts = input.split(COLON);

	return { taskName: parts[parts.length - 1], workspaceInput: parts.slice(0, -1).join(COLON) };
}

export function composeTaskIdentifier(workspaceLabel: string, taskName: string): string {
	if (workspaceLabel === "") {
		return taskName;
	}

	return [...workspaceLabel.split(COLON), taskName].join(COLON);
}

export function isWorkspaceQualified(input: string): boolean {
	return input.includes(COLON);
}
