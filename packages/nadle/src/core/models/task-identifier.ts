import { parseTaskReference, composeTaskIdentifier } from "@nadle/kernel";

/**
 * A unique identifier for a task, typically in the form 'workspaceId:taskName'.
 */
export type TaskIdentifier = string;

/**
 * Namespace for TaskIdentifier utility functions.
 */
export namespace TaskIdentifier {
	/**
	 * Create a TaskIdentifier from a workspace ID/label and a task name.
	 * @param workspaceIdOrLabel - The workspace ID or label (empty string for root workspace).
	 * @param taskName - The name of the task.
	 * @returns The composed TaskIdentifier string.
	 */
	export function create(workspaceIdOrLabel: string, taskName: string): TaskIdentifier {
		return composeTaskIdentifier(workspaceIdOrLabel, taskName);
	}

	/**
	 * Parse a TaskIdentifier string into its workspace and task name components.
	 * @param taskInput - The input string to parse.
	 * @returns An object with taskNameInput and workspaceInput (undefined if root workspace).
	 */
	export function parser(taskInput: string): { taskNameInput: string; workspaceInput: string | undefined } {
		const { taskName, workspaceInput } = parseTaskReference(taskInput);

		return { workspaceInput, taskNameInput: taskName };
	}
}
