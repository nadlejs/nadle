import { type Nadle } from "./nadle.js";

export type Awaitable<T> = T | PromiseLike<T>;

export interface Context {
	nadle: Nadle;
	env: NodeJS.ProcessEnv;
}

export type ContextualResolver<T = unknown> = (params: { context: Context }) => T;
export type Resolver<T = unknown> = T | ContextualResolver<T>;

export type TaskFn = ContextualResolver<Promise<void> | void>;

export interface Task<Options = unknown> {
	run(params: { options: Options; context: Context }): Promise<void> | void;
}

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
}

export interface ConfigBuilder {
	config(builder: ContextualResolver<TaskConfiguration> | TaskConfiguration): void;
}

export enum TaskStatus {
	Registered = "registered",
	Queued = "queued",
	Running = "running",
	Finished = "finished",
	Failed = "failed"
}

export interface RegisteredTask extends Task {
	name: string;
	status: TaskStatus;
	optionsResolver: Resolver | undefined;
	configResolver: ContextualResolver<TaskConfiguration>;
	result: {
		duration: number | null;
		startTime: number | null;
	};
}
