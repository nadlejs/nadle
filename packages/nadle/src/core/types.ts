import { type Nadle } from "./nadle.js";
import { type ILogger } from "./logger.js";
import { type Declaration } from "./caching/declaration.js";

export type Awaitable<T> = T | PromiseLike<T>;

export type MaybeArray<T> = T | T[];
export namespace MaybeArray {
	export function toArray<T>(value: MaybeArray<T>): T[] {
		return Array.isArray(value) ? value : [value];
	}
}

export interface RunnerContext {
	readonly logger: ILogger;
	readonly workingDir: string;
}

export interface InternalContext {
	readonly nadle: Nadle;
}

export type Callback<T = unknown, P = void> = (params: P) => T;
export type Resolver<T = unknown> = T | Callback<T>;

export type TaskFn = Callback<Awaitable<void>, { context: RunnerContext }>;

export interface Task<Options = unknown> {
	run: Callback<Awaitable<void>, { options: Options; context: RunnerContext }>;
}

export type TaskEnv = Record<string, string | number | boolean>;

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

export interface ConfigBuilder {
	config(builder: Callback<TaskConfiguration> | TaskConfiguration): void;
}

export enum TaskStatus {
	Registered = "registered",
	Scheduled = "scheduled",
	Running = "running",
	Finished = "finished",
	UpToDate = "up-to-date",
	FromCache = "from-cache",
	Failed = "failed"
}

export interface RegisteredTask extends Task {
	name: string;
	status: TaskStatus;
	optionsResolver: Resolver | undefined;
	configResolver: Callback<TaskConfiguration>;
	result: {
		duration: number | null;
		startTime: number | null;
	};
}
