import { registerTask } from "./core/task/register-task.js";

export const tasks = {
	register: registerTask
};

export * from "./core/interfaces/index.js";
export * from "./core/configuration/index.js";
export * from "./core/orchestration/index.js";
