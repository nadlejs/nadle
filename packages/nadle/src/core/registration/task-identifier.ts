import { COLON } from "../utilities/constants.js";

export type TaskIdentifier = string;

export namespace TaskIdentifier {
	const SEPARATOR = COLON;

	export function create(workspaceIdOrLabel: string, taskName: string): TaskIdentifier {
		if (workspaceIdOrLabel === "") {
			return taskName;
		}

		return [...workspaceIdOrLabel.split(SEPARATOR), taskName].join(SEPARATOR);
	}

	export function parser(taskInput: string): { taskNameInput: string; workspaceInput: string | undefined } {
		if (!taskInput.includes(SEPARATOR)) {
			return { taskNameInput: taskInput, workspaceInput: undefined };
		}

		const parts = taskInput.split(SEPARATOR);

		return { taskNameInput: parts[parts.length - 1], workspaceInput: parts.slice(0, -1).join(SEPARATOR) };
	}
}
