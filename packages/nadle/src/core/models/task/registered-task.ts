import { type Task } from "./task.js";
import { type TaskIdentifier } from "./task-identifier.js";
import { type TaskConfiguration } from "./task-configuration.js";
import { type Callback, type Resolver } from "../../utilities/types.js";

/**
 * Represents a task registered in the Nadle system.
 */
export interface RegisteredTask extends Task {
	/** Current status of the task. */
	status: TaskStatus;
	/** Task name (without workspace prefix). */
	readonly name: string;
	/** Human-readable label for the task. */
	readonly label: string;
	/** Unique identifier for the task. */
	readonly id: TaskIdentifier;
	/** Timing-related details about the task execution. */
	readonly timing: TaskTiming;
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

/**
 * Result information for a task's execution.
 */
interface TaskTiming {
	/** Duration of the task execution in milliseconds, or null if not finished. */
	duration: number | null;
	/** Start time of the task execution (epoch ms), or null if not started. */
	startTime: number | null;
}
