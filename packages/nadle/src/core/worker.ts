import { type MessagePort } from "node:worker_threads";

import { Nadle } from "./nadle.js";
import { taskRegistry } from "./task-registry.js";
import { type NadleResolvedOptions } from "./options.js";

export interface WorkerParams {
	readonly name: string;
	readonly port: MessagePort;
	readonly options: NadleResolvedOptions;
}

export default async ({ name, port, options }: WorkerParams) => {
	const nadle = new Nadle(options);
	await nadle.registerTask();

	const task = taskRegistry.getByName(name);
	const { optionsResolver } = task;
	const context = { nadle, env: process.env };
	const taskOptions = typeof optionsResolver === "function" ? optionsResolver(context) : optionsResolver;

	port.postMessage({ type: "start", taskName: name });
	await new Promise((resolve) => setImmediate(resolve));
	await new Promise((resolve) => process.nextTick(resolve));

	await task.run({ context, options: taskOptions });
};
