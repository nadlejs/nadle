import { taskRegistry } from "./task-registry.js";
import {
	type Task,
	TaskStatus,
	type TaskFn,
	type Resolver,
	type Callback,
	type ConfigBuilder,
	type RegisteredTask,
	type TaskConfiguration
} from "./types.js";

export function registerTask(name: string): ConfigBuilder;
export function registerTask(name: string, fnTask: TaskFn): ConfigBuilder;
export function registerTask<Options>(name: string, optTask: Task<Options>, optionsResolver: Resolver<Options>): ConfigBuilder;
export function registerTask(name: string, task?: TaskFn | Task, optionsResolver?: Resolver): ConfigBuilder {
	if (taskRegistry.has(name)) {
		throw new Error(`Task "${name}" already registered`);
	}

	let configCollector: Callback<TaskConfiguration> | TaskConfiguration = () => ({});

	const register = () => {
		taskRegistry.register(name, {
			name,
			status: TaskStatus.Registered,
			result: { duration: null, startTime: null },
			configResolver: () => {
				return typeof configCollector === "function" ? configCollector() : configCollector;
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

function computeTaskInfo(task: TaskFn | Task | undefined, optionsResolver?: Resolver): Pick<RegisteredTask, "run" | "optionsResolver"> {
	if (task === undefined) {
		return { run: () => {}, optionsResolver: undefined };
	}

	if (typeof task === "function") {
		return { run: task, optionsResolver: undefined };
	}

	if (optionsResolver === undefined) {
		throw new Error("Option builder is required for option task");
	}

	return { ...task, optionsResolver };
}
