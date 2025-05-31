import { type MessagePort } from "node:worker_threads";

import { Nadle } from "./nadle.js";
import { type Context } from "./types.js";
import { taskRegistry } from "./task-registry.js";
import { type NadleResolvedOptions } from "./options/index.js";

export interface WorkerParams {
	readonly name: string;
	readonly port: MessagePort;
	readonly env: NodeJS.ProcessEnv;
	readonly options: NadleResolvedOptions;
}

export default async ({ name, port, options, env: originalEnv }: WorkerParams) => {
	const nadle = new Nadle(options);
	await nadle.registerTask();

	const task = taskRegistry.getByName(name);
	const { optionsResolver } = task;
	const context: Context = { nadle };
	const taskOptions = typeof optionsResolver === "function" ? optionsResolver(context) : optionsResolver;

	port.postMessage({ type: "start", taskName: name });
	await new Promise((resolve) => setImmediate(resolve));
	await new Promise((resolve) => process.nextTick(resolve));

	const taskEnv: Record<string, string> = Object.fromEntries(
		Object.entries(task.configResolver({ context }) ?? {}).map(([key, val]) => [key, String(val)])
	);

	Object.assign(process.env, { ...originalEnv, ...taskEnv });

	await task.run({ context, options: taskOptions });

	for (const [key] of Object.entries(taskEnv)) {
		delete process.env[key];

		if (Object.hasOwn(originalEnv, key)) {
			process.env[key] = originalEnv[key];
		}
	}
};
