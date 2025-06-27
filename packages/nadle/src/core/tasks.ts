import { registerTask } from "./registration/register-task.js";
import { type Task, type TaskFn, type Resolver, type ConfigBuilder } from "./types.js";

export interface Tasks {
	register(name: string): ConfigBuilder;
	register(name: string, fnTask: TaskFn): ConfigBuilder;
	register<Options>(name: string, optTask: Task<Options>, optionsResolver: Resolver<Options>): ConfigBuilder;
}

export const tasks: Tasks = {
	register: registerTask
};
