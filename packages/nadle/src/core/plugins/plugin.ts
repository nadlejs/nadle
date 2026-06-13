import { type Task } from "../interfaces/task.js";
import { type Logger } from "../interfaces/logger.js";
import { type Listener } from "../interfaces/listener.js";
import { type Resolver, type Awaitable } from "../utilities/types.js";
import { type RegisteredTask } from "../interfaces/registered-task.js";
import { type TaskConfiguration } from "../interfaces/task-configuration.js";

/** What a plugin-contributed reporter receives. The full execution context is structurally assignable to this. */
export interface ReporterContext {
	/** The core logger. */
	readonly logger: Logger;
}

/** A task type a plugin contributes; registered as `tasks.register(name, task, optionsResolver).config(config)`. */
export interface PluginTask {
	/** The name users register / invoke the task under. */
	readonly name: string;
	/** The task definition (a `Task` object, as produced by `defineTask`). */
	readonly task: Task<never> | Task;
	/** Optional task configuration (inputs, outputs, dependsOn, group, …). */
	readonly config?: TaskConfiguration;
	/** Optional resolver for the task's options. */
	readonly optionsResolver?: Resolver;
}

/** A reporter a plugin contributes; selected by name via `--reporter <name>`. */
export interface PluginReporter {
	/** The name users select this reporter by. Must not collide with `default`/`agent`. */
	readonly name: string;
	/** Factory returning the reporter (a `Listener`), given the reporter context. */
	readonly create: (context: ReporterContext) => Listener;
}

/** Context passed to run-level hooks (`beforeAll`/`afterAll`). */
export interface RunHookContext<Options> {
	/** The core logger (respects `--log-level` and the active reporter). */
	readonly logger: Logger;
	/** The error — present only in `afterAll` when `outcome` is `"failed"`. */
	readonly error?: unknown;
	/** The options this plugin was applied with. */
	readonly pluginOptions: Options;
	/** The run outcome — present only in `afterAll`. */
	readonly outcome?: "success" | "failed";
	/** The tasks scheduled for this run. */
	readonly tasks: readonly RegisteredTask[];
}

/** Context passed to task-level hooks (`beforeTask`/`afterTask`). */
export interface TaskHookContext<Options> {
	/** The core logger (respects `--log-level` and the active reporter). */
	readonly logger: Logger;
	/** The error — present only in `afterTask` when `result` is `"failed"`. */
	readonly error?: unknown;
	/** The worker thread id — present in `beforeTask` (meaningless under the inline executor). */
	readonly threadId?: number;
	/** The task this hook fires for. */
	readonly task: RegisteredTask;
	/** The options this plugin was applied with. */
	readonly pluginOptions: Options;
	/** How the task settled — present only in `afterTask`. */
	readonly result?: "done" | "failed" | "up-to-date" | "from-cache" | "canceled";
}

/** Optional plugin lifecycle hooks. All run on the main thread. */
export interface PluginHooks<Options> {
	/** Runs once after the run settles (success or failure). */
	readonly afterAll?: (ctx: RunHookContext<Options>) => Awaitable<void>;
	/** Runs once before scheduling. Throwing aborts the run. */
	readonly beforeAll?: (ctx: RunHookContext<Options>) => Awaitable<void>;
	/** Runs after a task settles, for every outcome (see `ctx.result`). */
	readonly afterTask?: (ctx: TaskHookContext<Options>) => Awaitable<void>;
	/** Runs before a task actually executes (not fired for cache hits). */
	readonly beforeTask?: (ctx: TaskHookContext<Options>) => Awaitable<void>;
}

/** A nadle plugin. Apply it in `nadle.config.ts` with `use(plugin, options?)`. */
export interface NadlePlugin<Options = void> {
	/** Unique plugin name, used for dedup and error messages. */
	readonly name: string;
	/** Optional ordering: `pre` plugins run before normal, `post` after. */
	readonly enforce?: "pre" | "post";
	/** Lifecycle hooks this plugin registers. */
	readonly hooks?: PluginHooks<Options>;
	/** Task types this plugin contributes. */
	readonly tasks?: readonly PluginTask[];
	/** Custom reporters this plugin contributes. */
	readonly reporters?: readonly PluginReporter[];
}

/** Identity helper for authoring a plugin with full type inference (mirrors `defineTask`). */
export function definePlugin<Options = void>(plugin: NadlePlugin<Options>): NadlePlugin<Options> {
	return plugin;
}
