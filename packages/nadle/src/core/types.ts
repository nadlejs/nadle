import { type ILogger } from "./reporting/logger.js";
import { type Declaration } from "./caching/declaration.js";

/**
 * A type representing a value or a promise of a value.
 */
export type Awaitable<T> = T | PromiseLike<T>;

/**
 * Context object passed to task runners.
 */
export interface RunnerContext {
	/** Logger instance for reporting. */
	readonly logger: ILogger;
	/** The working directory for the task. */
	readonly workingDir: string;
}

/**
 * Generic callback type.
 * @template T Return type.
 * @template P Parameter type.
 */
export type Callback<T = unknown, P = void> = (params: P) => T;

/**
 * A value or a callback returning a value.
 * @template T The resolved type.
 */
export type Resolver<T = unknown> = T | Callback<T>;

/**
 * Function signature for a basic task.
 */
export type TaskFn = Callback<Awaitable<void>, { context: RunnerContext }>;

/**
 * Interface for a typed task with options.
 * @template Options The options type for the task.
 */
export interface Task<Options = unknown> {
	/**
	 * The function to run for this task.
	 * @param options - Task options.
	 * @param context - Runner context.
	 */
	run: Callback<Awaitable<void>, { options: Options; context: RunnerContext }>;
}

/**
 * Environment variables for a task.
 */
export type TaskEnv = Record<string, string | number | boolean>;

/**
 * Configuration for a Nadle task.
 */
export interface TaskConfiguration {
	/**
	 * The group name to which this task belongs.
	 */
	group?: string;

	/**
	 * The description of the task.
	 */
	description?: string;

	/**
	 * A list of tasks that this task depends on.
	 */
	dependsOn?: string[];

	/**
	 * Environment variables to set when running the task.
	 */
	env?: TaskEnv;

	/**
	 * Changes the working directory for the task.
	 */
	workingDir?: string;

	/**
	 * Input declaration for the task.
	 * Declare any files, directories or globs that the task reads from.
	 * These are used for cache key generation.
	 */
	inputs?: Declaration[];

	/**
	 * Output declaration for the task.
	 * Declare any files or directories that the task produces.
	 * These are used for caching, restoring, and cleanup.
	 */
	outputs?: Declaration[];
}

/**
 * Builder interface for configuring a task.
 */
export interface ConfigBuilder {
	/**
	 * Configure the task with a configuration object or builder callback.
	 * @param builder - Task configuration or a callback returning configuration.
	 */
	config(builder: Callback<TaskConfiguration> | TaskConfiguration): void;
}
