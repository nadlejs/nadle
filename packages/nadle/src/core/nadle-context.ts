import AsyncHooks from "node:async_hooks";

import { type TaskRegistry } from "./registration/task-registry.js";
import { type FileOptionRegistry } from "./registration/file-option-registry.js";

interface NadleInstance {
	readonly taskRegistry: TaskRegistry;
	readonly fileOptionRegistry: FileOptionRegistry;
}

const nadleContext = new AsyncHooks.AsyncLocalStorage<NadleInstance>();

export function runWithInstance<T>(instance: NadleInstance, fn: () => T): T {
	return nadleContext.run(instance, fn);
}

export function getCurrentInstance(): NadleInstance {
	const instance = nadleContext.getStore();

	if (!instance) {
		throw new Error("No active Nadle instance — tasks must be registered during config loading");
	}

	return instance;
}
