import { type Callback } from "../utilities/types.js";
import { type TaskIdentifier } from "../models/task-identifier.js";
import { type ResolvedTask } from "../interfaces/resolved-task.js";
import { type TaskConfiguration } from "../interfaces/task-configuration.js";

/**
 * Minimal task information needed by the scheduler.
 */
export interface SchedulerTask {
	readonly name: string;
	readonly id: TaskIdentifier;
	readonly workspaceId: string;
	readonly configResolver: Callback<TaskConfiguration>;
}

/**
 * Narrow logger contract for the scheduler.
 */
export interface SchedulerLogger {
	debug(message: unknown, ...args: unknown[]): void;
	throw(message: unknown, ...args: unknown[]): never;
}

/**
 * Options subset the scheduler needs.
 */
export interface SchedulerOptions {
	readonly parallel: boolean;
	readonly tasks: ResolvedTask[];
	readonly implicitDependencies: boolean;
	readonly excludedTasks: ResolvedTask[];
}

/**
 * Injectable dependencies for TaskScheduler.
 *
 * In production, the Nadle class satisfies this interface structurally.
 * In tests, a plain object can be constructed with minimal setup.
 */
export interface SchedulerDependencies {
	readonly logger: SchedulerLogger;
	readonly options: SchedulerOptions;
	isRootWorkspace(workspaceId: string): boolean;
	getTaskById(taskId: TaskIdentifier): SchedulerTask;
	getTasksByName(taskName: string): readonly SchedulerTask[];
	getWorkspaceDependencies(workspaceId: string): readonly string[];
	parseTaskRef(input: string, targetWorkspaceId: string): TaskIdentifier;
}
