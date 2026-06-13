import { type ExecutionContext } from "../context.js";
import { type Listener } from "../interfaces/listener.js";
import { type PluginRegistry } from "./plugin-registry.js";
import { type RegisteredTask } from "../interfaces/registered-task.js";
import { type PluginHooks, type RunHookContext, type TaskHookContext } from "./plugin.js";

type RunHook = "beforeAll" | "afterAll";
type TaskHook = "beforeTask" | "afterTask";

/**
 * Bridges nadle's lifecycle events to plugin hooks (all on the main thread).
 * `beforeAll` (onExecutionStart) is allowed to throw and abort the run; `afterAll`
 * (onExecutionFinish/Failed) errors are caught and downgraded to a warning so
 * teardown never turns a settled run red.
 */
export class PluginListener implements Listener {
	public constructor(
		private readonly context: ExecutionContext,
		private readonly registry: PluginRegistry
	) {}

	public async onExecutionStart(): Promise<void> {
		await this.dispatch("beforeAll", {});
	}

	public async onExecutionFinish(): Promise<void> {
		await this.dispatchSafe("afterAll", { outcome: "success" });
	}

	public async onExecutionFailed(error: unknown): Promise<void> {
		await this.dispatchSafe("afterAll", { error, outcome: "failed" });
	}

	public async onTaskStart(task: RegisteredTask, threadId: number): Promise<void> {
		await this.dispatchTaskSafe("beforeTask", task, { threadId });
	}

	public async onTaskFinish(task: RegisteredTask): Promise<void> {
		await this.dispatchTaskSafe("afterTask", task, { result: "done" });
	}

	public async onTaskFailed(task: RegisteredTask): Promise<void> {
		await this.dispatchTaskSafe("afterTask", task, { result: "failed" });
	}

	public async onTaskUpToDate(task: RegisteredTask): Promise<void> {
		await this.dispatchTaskSafe("afterTask", task, { result: "up-to-date" });
	}

	public async onTaskRestoreFromCache(task: RegisteredTask): Promise<void> {
		await this.dispatchTaskSafe("afterTask", task, { result: "from-cache" });
	}

	public async onTaskCanceled(task: RegisteredTask): Promise<void> {
		await this.dispatchTaskSafe("afterTask", task, { result: "canceled" });
	}

	private async dispatchTaskSafe(hook: TaskHook, task: RegisteredTask, extra: Partial<TaskHookContext<unknown>>): Promise<void> {
		for (const { plugin, options } of this.registry.getOrdered()) {
			const fn = (plugin.hooks as PluginHooks<unknown> | undefined)?.[hook];
			const ctx: TaskHookContext<unknown> = { task, pluginOptions: options, logger: this.context.logger, ...extra };

			try {
				await fn?.(ctx);
			} catch (error) {
				this.context.logger.warn(`Plugin ${plugin.name} ${hook} hook failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	}

	private buildContext(extra: Partial<RunHookContext<unknown>>, options: unknown): RunHookContext<unknown> {
		return { pluginOptions: options, logger: this.context.logger, tasks: this.context.taskRegistry.tasks, ...extra };
	}

	private async dispatch(hook: RunHook, extra: Partial<RunHookContext<unknown>>): Promise<void> {
		for (const { plugin, options } of this.registry.getOrdered()) {
			const fn = (plugin.hooks as PluginHooks<unknown> | undefined)?.[hook];
			await fn?.(this.buildContext(extra, options));
		}
	}

	private async dispatchSafe(hook: RunHook, extra: Partial<RunHookContext<unknown>>): Promise<void> {
		for (const { plugin, options } of this.registry.getOrdered()) {
			const fn = (plugin.hooks as PluginHooks<unknown> | undefined)?.[hook];

			try {
				await fn?.(this.buildContext(extra, options));
			} catch (error) {
				this.context.logger.warn(`Plugin ${plugin.name} ${hook} hook failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	}
}
