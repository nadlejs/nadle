import { Consola } from "../consola.js";
import {
	type Task,
	type TaskFn,
	type Resolver,
	type ConfigBuilder,
	type RegisteredTask,
	type TaskConfiguration,
	type ContextualResolver
} from "./types.js";

/** @internal */
export const taskRegistry = new Map<string, RegisteredTask>();

export function registerTask(name: string, fnTask: TaskFn): ConfigBuilder;
export function registerTask<Options>(name: string, optTask: Task<Options>, optionsResolver: Resolver<Options>): ConfigBuilder;
export function registerTask(name: string, task: TaskFn | Task, optionsResolver?: Resolver): ConfigBuilder {
	if (taskRegistry.has(name)) {
		throw new Error(`Task "${name}" already registered`);
	}

	let configCollector: ContextualResolver<TaskConfiguration> | TaskConfiguration = () => ({});

	const register = () => {
		taskRegistry.set(name, {
			name,
			configResolver: (params) => {
				Consola.info("Compute metadata for task", name);

				return typeof configCollector === "function" ? configCollector(params) : configCollector;
			},
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

function computeTaskInfo(task: TaskFn | Task, optionsResolver?: Resolver): Pick<RegisteredTask, "run" | "optionsResolver"> {
	if (typeof task === "function") {
		return { run: task, optionsResolver: undefined };
	}

	if (optionsResolver === undefined) {
		throw new Error("Option builder is required for option task");
	}

	return { ...task, optionsResolver: optionsResolver };
}

export function getRegisteredTasks() {
	return [...taskRegistry.values()];
}
