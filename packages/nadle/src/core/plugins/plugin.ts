import { type Task } from "../interfaces/task.js";
import { type ExecutionContext } from "../context.js";
import { type Logger } from "../interfaces/logger.js";
import { type Listener } from "../interfaces/listener.js";
import { type Resolver, type Awaitable } from "../utilities/types.js";
import { type RegisteredTask } from "../interfaces/registered-task.js";
import { type TaskConfiguration } from "../interfaces/task-configuration.js";

/** A task type a plugin contributes; registered as tasks.register(name, task, optionsResolver).config(config). */
export interface PluginTask {
	readonly name: string;
	readonly task: Task<never> | Task;
	readonly config?: TaskConfiguration;
	readonly optionsResolver?: Resolver;
}

/** A reporter a plugin contributes; `create` returns a Listener (like DefaultReporter). */
export interface PluginReporter {
	readonly name: string;
	readonly create: (context: ExecutionContext) => Listener;
}

/** Context shared by run-level hooks (beforeAll/afterAll). */
export interface RunHookContext<Options> {
	readonly logger: Logger;
	readonly error?: unknown;
	readonly pluginOptions: Options;
	readonly outcome?: "success" | "failed";
	readonly tasks: readonly RegisteredTask[];
}

/** Context shared by task-level hooks (beforeTask/afterTask). */
export interface TaskHookContext<Options> {
	readonly logger: Logger;
	readonly error?: unknown;
	readonly threadId?: number;
	readonly task: RegisteredTask;
	readonly pluginOptions: Options;
	readonly result?: "done" | "failed" | "up-to-date" | "from-cache" | "canceled";
}

/** Optional lifecycle hooks. All run on the main thread. */
export interface PluginHooks<Options> {
	readonly afterAll?: (ctx: RunHookContext<Options>) => Awaitable<void>;
	readonly beforeAll?: (ctx: RunHookContext<Options>) => Awaitable<void>;
	readonly afterTask?: (ctx: TaskHookContext<Options>) => Awaitable<void>;
	readonly beforeTask?: (ctx: TaskHookContext<Options>) => Awaitable<void>;
}

/** A nadle plugin. Applied via use(plugin, options?). */
export interface NadlePlugin<Options = void> {
	readonly name: string;
	readonly enforce?: "pre" | "post";
	readonly hooks?: PluginHooks<Options>;
	readonly tasks?: readonly PluginTask[];
	readonly reporters?: readonly PluginReporter[];
}

/** Identity helper for authoring a plugin with full type inference (mirrors defineTask). */
export function definePlugin<Options = void>(plugin: NadlePlugin<Options>): NadlePlugin<Options> {
	return plugin;
}
