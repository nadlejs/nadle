import { VALID_TASK_NAME_PATTERN } from "@nadle/kernel";

import { Messages } from "../utilities/messages.js";
import { getCurrentInstance } from "../nadle-context.js";
import { ConfigurationError } from "../utilities/nadle-error.js";
import type { Task, RunnerContext } from "../interfaces/task.js";
import { type RegisteredTask } from "../interfaces/registered-task.js";
import type { Callback, Resolver, Awaitable } from "../utilities/types.js";
import type { TaskConfiguration } from "../interfaces/task-configuration.js";

/**
 * The main API for registering tasks in Nadle.
 *
 * Provides overloaded `register` methods for defining tasks with or without options and custom resolvers.
 * Each method returns a TaskConfigurationBuilder for further configuration.
 */
export interface TasksAPI {
	/**
	 * Register a task by name only.
	 * @param name - The unique name of the task.
	 * @returns ConfigBuilder for further configuration.
	 */
	register(name: string): TaskConfigurationBuilder;

	/**
	 * Register a task with options and a resolver.
	 *
	 * The resolver may be omitted when the task's options have no required fields
	 * (i.e. an empty object satisfies `Options`); otherwise it is mandatory.
	 * @param name - The unique name of the task.
	 * @param optTask - The task definition with options.
	 * @param optionsResolver - A resolver for the task's options.
	 * @returns ConfigBuilder for further configuration.
	 */
	register<Options>(
		name: string,
		optTask: Task<Options>,
		...optionsResolver: {} extends Options ? [optionsResolver?: Resolver<Options>] : [optionsResolver: Resolver<Options>]
	): TaskConfigurationBuilder;

	/**
	 * Register a task with a task function.
	 * @param name - The unique name of the task.
	 * @param fnTask - The function to execute for this task.
	 * @returns ConfigBuilder for further configuration.
	 */
	register(name: string, fnTask: TaskFn): TaskConfigurationBuilder;
}

/**
 * Builder interface for configuring a task.
 */
export interface TaskConfigurationBuilder {
	/**
	 * Configure the task with a configuration object or builder callback.
	 * @param builder - Task configuration or a callback returning configuration.
	 */
	config(builder: Callback<TaskConfiguration> | TaskConfiguration): void;
}

/**
 * Function signature for a basic task.
 */
export type TaskFn = Callback<Awaitable<void>, { context: RunnerContext }>;

/**
 * The main tasks API instance for registering tasks in Nadle.
 *
 * Use this object to register new tasks and configure them using the fluent API.
 *
 * Example:
 * ```ts
 * tasks.register("build", async ({ context }) => { ... }).config({ ... });
 * ```
 */
export const tasks: TasksAPI = {
	register: (name: string, task?: TaskFn | Task, optionsResolver?: Resolver): TaskConfigurationBuilder => {
		const { taskRegistry } = getCurrentInstance();

		validateTaskName(name);

		if (taskRegistry.hasTaskName(name)) {
			throw new ConfigurationError(Messages.DuplicatedTaskName(name, taskRegistry.workspaceId ?? ""));
		}

		let configCollector: Callback<TaskConfiguration> | TaskConfiguration = () => ({});

		const register = () => {
			// Resolve the config at most once per task (configuration avoidance, #647):
			// the user's config callback can do real work, and it is read several times
			// per run (scheduling, execution, reporting). Memoize so it runs only once.
			let resolved: TaskConfiguration | undefined;

			taskRegistry.register({
				name,
				configResolver: () => (resolved ??= validateConfig(name, typeof configCollector === "function" ? configCollector() : configCollector)),
				...computeTaskInfo(task, optionsResolver)
			});
		};

		register();

		return {
			config: (collector) => {
				configCollector = collector;
				register();
			}
		};
	}
};

function computeTaskInfo(task: TaskFn | Task | undefined, optionsResolver?: Resolver): Pick<RegisteredTask, "run" | "optionsResolver" | "empty"> {
	if (task === undefined) {
		return { empty: true, run: () => {}, optionsResolver: undefined };
	}

	if (typeof task === "function") {
		return { run: task, empty: false, optionsResolver: undefined };
	}

	return { ...task, empty: false, optionsResolver: optionsResolver ?? (() => ({})) };
}

function validateTaskName(name: string): void {
	if (!VALID_TASK_NAME_PATTERN.test(name)) {
		throw new ConfigurationError(Messages.InvalidTaskName(`[${name}]`));
	}
}

function validateConfig(name: string, config: TaskConfiguration): TaskConfiguration {
	if (config.timeout !== undefined && (!Number.isInteger(config.timeout) || config.timeout <= 0)) {
		throw new ConfigurationError(`Task ${name} has an invalid timeout: ${config.timeout}. Expected a positive integer.`);
	}

	if (config.retries !== undefined && (!Number.isInteger(config.retries) || config.retries < 0)) {
		throw new ConfigurationError(`Task ${name} has an invalid retries: ${config.retries}. Expected a non-negative integer.`);
	}

	return config;
}
