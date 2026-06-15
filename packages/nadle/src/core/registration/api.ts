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
	/** Register a task from a lazily-resolved keyed spec (see {@link lazy}). */
	register<Options>(name: string, spec: LazySpec<Options>): void;
	/*
	 * Overload order below is semantically significant: TS picks the first matching
	 * overload, so the `run: Task<Options>` overload MUST precede the config-only
	 * `run?: TaskFn` overload to enforce required options on tasks with required fields.
	 * perfectionist would sort these alphabetically and invert that contract, so it is
	 * disabled here.
	 */
	/* eslint-disable perfectionist/sort-interfaces */
	/**
	 * Register a task from a keyed spec whose body (`run`) is a {@link Task}.
	 * `Options` is inferred from `run` so `options` is demanded when the task
	 * body has required option fields and optional otherwise. Placed before the
	 * config-only overload so TS prefers it whenever `run` is a Task object.
	 */
	register<Options>(
		name: string,
		spec: TaskConfiguration & { run: Task<Options> } & ({} extends Options ? { options?: Resolver<Options> } : { options: Resolver<Options> })
	): void;
	/** Register a task from a config-only keyed spec, or one with an inline function body. */
	register(name: string, spec: TaskConfiguration & { run?: TaskFn }): void;
	/* eslint-enable perfectionist/sort-interfaces */
}

/**
 * Function signature for a basic task.
 */
export type TaskFn = Callback<Awaitable<void>, { context: RunnerContext }>;

/**
 * A task registration spec. `run`/`options` are required when the task body's
 * `Options` has required fields, optional otherwise. Config fields
 * (group, dependsOn, …) come from TaskConfiguration and sit directly on the spec.
 * `run` and `options` are reserved keys and must never be added to TaskConfiguration.
 */
export type TaskSpec<Options = void> = TaskConfiguration &
	// Tuple wrapping `[void] extends [Options]` suppresses distributivity: plain
	// `void extends Options` distributes over unions and lands void in the wrong branch.
	([void] extends [Options]
		? { options?: Resolver<Options>; run?: TaskFn | Task<Options> }
		: {} extends Options
			? { options?: Resolver<Options>; run?: TaskFn | Task<Options> }
			: { run: Task<Options>; options: Resolver<Options> });

/** Stable public name for register's spec argument; internals of TaskSpec can be refined without breaking callers. Thunk form intentionally dropped. */
export type SpecArg<Options = void> = TaskSpec<Options>;

const LAZY_SPEC = Symbol("nadle.lazySpec");

/**
 * A branded spec thunk produced by {@link lazy}. The config portion of the wrapped
 * spec is resolved lazily (and memoized) when first read.
 *
 * Branded with a public `__nadleLazySpec` marker (not just the private `[LAZY_SPEC]`
 * symbol) so the structural shape survives `.d.ts` emission: a symbol-only member is
 * stripped, leaving `{}` which would match any object and defeat overload resolution.
 */
export interface LazySpec<Options = void> {
	/** Brand that survives d.ts emission so LazySpec stays distinguishable from a plain spec. */
	readonly __nadleLazySpec: true;
	/** @internal The wrapped spec thunk. */
	readonly [LAZY_SPEC]: () => TaskSpec<Options>;
}

/** Wrap a spec thunk for deferred (lazy, memoized) config resolution. */
export function lazy<Options = void>(thunk: () => TaskSpec<Options>): LazySpec<Options> {
	return { [LAZY_SPEC]: thunk, __nadleLazySpec: true };
}

function isLazySpec(value: unknown): value is LazySpec {
	return typeof value === "object" && value !== null && LAZY_SPEC in value;
}

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
	register: (name: string, second?: TaskFn | SpecArg<unknown> | LazySpec): void => {
		const { taskRegistry } = getCurrentInstance();

		validateTaskName(name);

		if (taskRegistry.hasTaskName(name)) {
			throw new ConfigurationError(Messages.DuplicatedTaskName(name, taskRegistry.workspaceId ?? ""));
		}

		const { run, options, getConfig } = normalizeSecondArg(second);

		// Resolve the config at most once per task (configuration avoidance, #647):
		// validation is read several times per run (scheduling, execution, reporting).
		// Memoize so it runs only once.
		let resolved: TaskConfiguration | undefined;

		taskRegistry.register({
			name,
			configResolver: () => (resolved ??= validateConfig(name, getConfig())),
			...computeTaskInfo(run, options)
		});
	}
};

interface NormalizedSpec {
	readonly options: Resolver | undefined;
	readonly run: TaskFn | Task | undefined;
	readonly getConfig: () => TaskConfiguration;
}

/**
 * Normalize register's 2nd arg into run/options (eager — needed for task identity)
 * and a `getConfig` thunk (resolved at most once, when the config is first read):
 *   - undefined → placeholder; function → inline body; LazySpec → deferred config;
 *     plain object → eager spec.
 */
function normalizeSecondArg(second?: TaskFn | SpecArg<unknown> | LazySpec): NormalizedSpec {
	if (typeof second === "function") {
		return { options: undefined, run: second as TaskFn, getConfig: () => ({}) };
	}

	if (isLazySpec(second)) {
		// Invoke the thunk at most once: run/options are pulled eagerly here (they
		// define task identity), and the same memoized spec feeds the deferred config.
		let cached: TaskSpec | undefined;
		const resolveSpec = () => (cached ??= second[LAZY_SPEC]());
		const { run: specRun, options: specOptions } = resolveSpec();

		return {
			run: specRun as TaskFn | Task | undefined,
			options: specOptions as Resolver | undefined,
			getConfig: () => {
				const { run: _run, options: _options, ...config } = resolveSpec();

				return config;
			}
		};
	}

	if (second !== undefined) {
		const { run: specRun, options: specOptions, ...config } = second as TaskSpec;

		return { getConfig: () => config, run: specRun as TaskFn | Task | undefined, options: specOptions as Resolver | undefined };
	}

	return { run: undefined, options: undefined, getConfig: () => ({}) };
}

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
