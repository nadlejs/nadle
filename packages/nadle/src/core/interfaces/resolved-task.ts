/**
 * Represents a task after input resolution and auto-correction.
 */
export interface ResolvedTask {
	/** The fully qualified ID of the resolved task */
	readonly taskId: string;
	/** The original input string provided by the user. */
	readonly rawInput: string;
	/** True if the input was auto-corrected or resolved to the root workspace task, false if matched exactly. */
	readonly corrected: boolean;
}
export namespace ResolvedTask {
	export const getId = (task: ResolvedTask) => task.taskId;
}
