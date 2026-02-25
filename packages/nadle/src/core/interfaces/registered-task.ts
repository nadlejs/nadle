import { type Task } from "./task.js";
import { type TaskConfiguration } from "./task-configuration.js";
import { type TaskIdentifier } from "../models/task-identifier.js";
import { type Callback, type Resolver } from "../utilities/types.js";

/**
 * Represents a task registered in the Nadle system.
 */
export interface RegisteredTask extends Task {
	/** Task name (without workspace prefix). */
	readonly name: string;
	/** Human-readable label for the task. */
	readonly label: string;
	/** Whether this is an empty (lifecycle-only) task with no function body. */
	readonly empty: boolean;
	/** Unique identifier for the task. */
	readonly id: TaskIdentifier;
	/** Workspace ID this task belongs to. */
	readonly workspaceId: string;
	/** Resolver for task options, if any. */
	readonly optionsResolver: Resolver | undefined;
	/** Resolver for task configuration. */
	readonly configResolver: Callback<TaskConfiguration>;
}

/**
 * Status values for a registered task in the Nadle system.
 */
export enum TaskStatus {
	/** Task is registered but not yet scheduled. */
	Registered = "registered",
	/** Task is scheduled for execution. */
	Scheduled = "scheduled",
	/** Task is currently running. */
	Running = "running",
	/** Task has finished execution. */
	Finished = "finished",
	/** Task is up-to-date and does not need to run. */
	UpToDate = "up-to-date",
	/** Task result was restored from cache. */
	FromCache = "from-cache",
	/** Task execution failed. */
	Failed = "failed",
	/** Task was canceled before completion. */
	Canceled = "canceled"
}
