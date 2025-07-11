import { COLON } from "../../utilities/constants.js";

/**
 * A unique identifier for a task, typically in the form 'workspaceId:taskName'.
 */
export type TaskIdentifier = string;

/**
 * Namespace for TaskIdentifier utility functions.
 */
export namespace TaskIdentifier {
	const SEPARATOR = COLON;

	/**
	 * Create a TaskIdentifier from a workspace ID/label and a task name.
	 * @param workspaceIdOrLabel - The workspace ID or label (empty string for root workspace).
	 * @param taskName - The name of the task.
	 * @returns The composed TaskIdentifier string.
	 */
	export function create(workspaceIdOrLabel: string, taskName: string): TaskIdentifier {
		if (workspaceIdOrLabel === "") {
			return taskName;
		}

		return [...workspaceIdOrLabel.split(SEPARATOR), taskName].join(SEPARATOR);
	}

	/**
	 * Parse a TaskIdentifier string into its workspace and task name components.
	 * @param taskInput - The input string to parse.
	 * @returns An object with taskNameInput and workspaceInput (undefined if root workspace).
	 */
	export function parser(taskInput: string): { taskNameInput: string; workspaceInput: string | undefined } {
		if (!taskInput.includes(SEPARATOR)) {
			return { taskNameInput: taskInput, workspaceInput: undefined };
		}

		const parts = taskInput.split(SEPARATOR);

		return { taskNameInput: parts[parts.length - 1], workspaceInput: parts.slice(0, -1).join(SEPARATOR) };
	}
}
