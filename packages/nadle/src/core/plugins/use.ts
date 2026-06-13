import { tasks } from "../registration/api.js";
import { getCurrentInstance } from "../nadle-context.js";
import { type PluginTask, type NadlePlugin } from "./plugin.js";
import { ConfigurationError } from "../utilities/nadle-error.js";

/**
 * Apply a plugin during config load: record it (and its options) in the plugin
 * registry and register any task types it contributes. Call from `nadle.config.ts`.
 */
export function use<Options = void>(plugin: NadlePlugin<Options>, options?: Options): void {
	if (typeof plugin !== "object" || plugin === null || typeof plugin.name !== "string" || plugin.name.length === 0) {
		throw new ConfigurationError("use() expects a plugin object with a non-empty string name.");
	}

	const { pluginRegistry } = getCurrentInstance();
	pluginRegistry.apply(plugin as NadlePlugin<never>, options);

	for (const pluginTask of plugin.tasks ?? []) {
		registerPluginTask(pluginTask);
	}
}

function registerPluginTask({ name, task, config, optionsResolver }: PluginTask): void {
	const builder = optionsResolver === undefined ? tasks.register(name, task as never) : tasks.register(name, task as never, optionsResolver);

	if (config !== undefined) {
		builder.config(config);
	}
}
