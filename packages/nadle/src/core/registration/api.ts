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
 * Provides overloaded `register` methods for registering tasks by name only,
 * with an inline function body, or from a keyed spec object.
 */
export interface TasksAPI {
	/** Register a placeholder/aggregator task (name only). */
	register(name: string): void;
	/** Register a task with an inline function body. */
	register(name: string, fn: TaskFn): void;
	/** Register a task from a keyed spec. */
	register<Options>(name: string, spec: SpecArg<Options>): void;
}

/**
 * Function signature for a basic task.
 */
export type TaskFn = Callback<Awaitable<void>, { context: RunnerContext }>;

/**
 * A task registration spec. `run`/`options` are required when the task body's
 * `Options` has required fields, optional/omittable otherwise. Config fields
 * (group, dependsOn, …) come from TaskConfiguration and sit directly on the spec.
 * `run` and `options` are reserved keys and must never be added to TaskConfiguration.
 */
export type TaskSpec<Options = void> = TaskConfiguration &
	// Tuple wrapping `[void] extends [Options]` suppresses distributivity: plain
	// `void extends Options` distributes over unions and lands void in the wrong branch.
	([void] extends [Options]
		? { run?: TaskFn | Task<Options>; options?: Resolver<Options> }
		: {} extends Options
			? { run?: TaskFn | Task<Options>; options?: Resolver<Options> }
			: { run: Task<Options>; options: Resolver<Options> });

/** Stable public name for register's spec argument; internals of TaskSpec can be refined without breaking callers. Thunk form intentionally dropped. */
export type SpecArg<Options = void> = TaskSpec<Options>;

/**
 * The main tasks API instance for registering tasks in Nadle.
 *
 * Use this object to register new tasks by name, inline function, or keyed spec.
 *
 * Example:
 * ```ts
 * tasks.register("build", { run: async ({ context }) => { ... }, group: "Build" });
 * ```
 */
export const tasks: TasksAPI = {
	register: (name: string, second?: TaskFn | SpecArg<unknown>): void => {
		const { taskRegistry } = getCurrentInstance();

		validateTaskName(name);

		if (taskRegistry.hasTaskName(name)) {
			throw new ConfigurationError(Messages.DuplicatedTaskName(name, taskRegistry.workspaceId ?? ""));
		}

		// Normalize the 2nd arg: undefined → placeholder; function → inline body;
		// object → eager spec. (No top-level thunk: that form was intentionally dropped.)
		let run: TaskFn | Task | undefined;
		let options: Resolver | undefined;
		let config: TaskConfiguration = {};

		if (typeof second === "function") {
			run = second as TaskFn;
		} else if (second !== undefined) {
			const { run: specRun, options: specOptions, ...rest } = second as TaskSpec;

			run = specRun as TaskFn | Task | undefined;
			options = specOptions as Resolver | undefined;
			config = rest;
		}

		// Resolve the config at most once per task (configuration avoidance, #647):
		// validation is read several times per run (scheduling, execution, reporting).
		// Memoize so it runs only once.
		let resolved: TaskConfiguration | undefined;

		taskRegistry.register({
			name,
			configResolver: () => (resolved ??= validateConfig(name, config)),
			...computeTaskInfo(run, options)
		});
	}
};

function computeTaskInfo(run: TaskFn | Task | undefined, options?: Resolver): Pick<RegisteredTask, "run" | "optionsResolver" | "empty"> {
	if (run === undefined) {
		return { empty: true, run: () => {}, optionsResolver: undefined };
	}

	if (typeof run === "function") {
		return { run, empty: false, optionsResolver: undefined };
	}

	return { ...run, empty: false, optionsResolver: options ?? (() => ({})) };
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
