import type { Awaitable } from "../utilities/index.js";
import type { RegisteredTask } from "./registered-task.js";

/**
 * Listener interface for handling various task and execution lifecycle events.
 */
export interface Listener {
	/**
	 * Called when execution starts.
	 */
	readonly onExecutionStart?: () => Awaitable<void>;

	/**
	 * Called when execution finishes successfully.
	 */
	readonly onExecutionFinish?: () => Awaitable<void>;

	/**
	 * Called when execution fails.
	 * @param error The error that caused the failure.
	 */
	readonly onExecutionFailed?: (error: unknown) => Awaitable<void>;

	/**
	 * Called when a task finishes successfully.
	 * @param task The finished task.
	 */
	readonly onTaskFinish?: (task: RegisteredTask) => Awaitable<void>;

	/**
	 * Called when a task fails.
	 * @param task The failed task.
	 */
	readonly onTaskFailed?: (task: RegisteredTask) => Awaitable<void>;

	/**
	 * Called when a task is canceled.
	 * @param task The canceled task.
	 */
	readonly onTaskCanceled?: (task: RegisteredTask) => Awaitable<void>;

	/**
	 * Called when a task is up to date and does not need to run.
	 * @param task The up-to-date task.
	 */
	readonly onTaskUpToDate?: (task: RegisteredTask) => Awaitable<void>;

	/**
	 * Called when tasks are scheduled for execution.
	 * @param tasks The scheduled tasks.
	 */
	readonly onTasksScheduled?: (tasks: RegisteredTask[]) => Awaitable<void>;

	/**
	 * Called when a task is restored from cache.
	 * @param task The restored task.
	 */
	readonly onTaskRestoreFromCache?: (task: RegisteredTask) => Awaitable<void>;

	/**
	 * Called when a task starts execution.
	 * @param task The started task.
	 * @param threadId The thread ID where the task is running.
	 */
	readonly onTaskStart?: (task: RegisteredTask, threadId: number) => Awaitable<void>;

	/**
	 * Optional initialization method for the listener.
	 * @returns The initialized listener instance.
	 */
	readonly init?: () => Awaitable<this>;
}
