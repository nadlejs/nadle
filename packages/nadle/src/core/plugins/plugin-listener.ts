import { type ExecutionContext } from "../context.js";
import { type Listener } from "../interfaces/listener.js";
import { type PluginRegistry } from "./plugin-registry.js";
import { type PluginHooks, type RunHookContext } from "./plugin.js";

type RunHook = "beforeAll" | "afterAll";

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
