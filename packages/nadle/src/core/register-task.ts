import { Consola } from "../consola.js";
import { type TaskFn, type TaskMeta, type TaskContext, type RegisteredTask } from "./types.js";

/** @internal */
export const taskRegistry = new Map<string, RegisteredTask>();

export function registerTask(name: string, fn: TaskFn): { meta: (collector: (context: TaskContext) => void) => void } {
	if (taskRegistry.has(name)) {
		throw new Error(`Task "${name}" already registered`);
	}

	let metaCollector: (context: TaskContext) => void = () => {};

	const register = () => {
		taskRegistry.set(name, {
			name,
			run: fn,
			getMetadata: (context) => {
				Consola.info("Compute metadata for task", name);
				let capturedConfig: TaskMeta = {};
				context.configure = (meta: TaskMeta) => {
					capturedConfig = meta;
				};

				metaCollector(context);

				return capturedConfig;
			}
		});
	};

	register();

	return {
		meta: (collector) => {
			metaCollector = collector;
			register();
		}
	};
}

export function getRegisteredTasks() {
	return [...taskRegistry.values()];
}
