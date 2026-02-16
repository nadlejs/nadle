import { type Logger } from "./interfaces/logger.js";
import { type EventEmitter } from "./models/event-emitter.js";
import { type NadleResolvedOptions } from "./options/types.js";
import { type TaskScheduler } from "./engine/task-scheduler.js";
import { type TaskRegistry } from "./registration/task-registry.js";
import { type ExecutionTracker } from "./models/execution-tracker.js";
import { type DefaultLogger } from "./interfaces/defaults/default-logger.js";

/**
 * Represents the internal state of a Nadle execution session.
 */
export interface State {
	/** Indicates whether Nadle is currently in the task selection mode */
	readonly selectingTasks: boolean;
}

/**
 * Provides access to project-level configuration and services.
 * Used by modules that only need to read project config and log messages
 * (e.g., simple handlers, task scheduler).
 */
export interface ProjectContext {
	readonly logger: Logger;
	readonly taskRegistry: TaskRegistry;
	readonly options: NadleResolvedOptions;
}

/**
 * Extends {@link ProjectContext} with execution-specific services.
 * Used by modules that participate in task execution
 * (e.g., task pool, reporter, execute handler).
 */
export interface ExecutionContext extends ProjectContext {
	state: State;
	readonly logger: DefaultLogger;
	readonly eventEmitter: EventEmitter;
	readonly taskScheduler: TaskScheduler;
	readonly executionTracker: ExecutionTracker;
	updateState(updater: (state: State) => State): void;
}
