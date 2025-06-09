import { type Nadle } from "./core/orchestration/nadle.js";

export type Awaitable<T> = T | PromiseLike<T>;

export interface Context {
	readonly nadle: Nadle;
}

export type Callback<T = unknown, P = { context: Context }> = (params: P) => T;
export type Resolver<T = unknown> = T | Callback<T>;

export type TaskFn = Callback<Awaitable<void>, { context: Context & { workingDir: string } }>;

export interface Task<Options = unknown> {
	run: Callback<Awaitable<void>, { options: Options; context: Context & { workingDir: string } }>;
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
}

export interface ConfigBuilder {
	config(builder: Callback<TaskConfiguration> | TaskConfiguration): void;
}

export enum TaskStatus {
	Registered = "registered",
	Scheduled = "scheduled",
	Running = "running",
	Finished = "finished",
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
