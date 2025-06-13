import Path from "node:path";
import { threadId, type MessagePort } from "node:worker_threads";

import c from "tinyrainbow";

import { Nadle } from "./nadle.js";
import { taskRegistry } from "./task-registry.js";
import { type Context, type TaskEnv } from "./types.js";
import { CacheValidator } from "./caching/cache-validator.js";
import { type NadleResolvedOptions } from "./options/types.js";
import { CacheMissReason } from "./caching/cache-miss-reason.js";

export interface WorkerParams {
	readonly taskName: string;
	readonly port: MessagePort;
	readonly env: NodeJS.ProcessEnv;
	readonly options: NadleResolvedOptions;
}

export default async ({ port, options, taskName, env: originalEnv }: WorkerParams) => {
	const nadle = new Nadle(options);
	await nadle.registerTask();

	const task = taskRegistry.getByName(taskName);
	const { optionsResolver } = task;
	const context: Context = { nadle };
	const taskOptions = typeof optionsResolver === "function" ? optionsResolver(context) : optionsResolver;

	port.postMessage({ threadId, type: "start", taskName: taskName });
	await new Promise((resolve) => setImmediate(resolve));
	await new Promise((resolve) => process.nextTick(resolve));

	const taskConfig = task.configResolver({ context });

	const environmentInjector = createEnvironmentInjector(originalEnv, taskConfig.env);
	const workingDir = taskConfig.workingDir ? Path.resolve(taskConfig.workingDir) : process.cwd();

	const cacheValidator = new CacheValidator(taskName, taskConfig, workingDir, Path.dirname(options.configPath));
	const validationResult = await cacheValidator.validate();

	const execute = async () => {
		environmentInjector.apply();

		await task.run({ options: taskOptions, context: { ...context, workingDir } });

		environmentInjector.restore();
	};

	nadle.logger.info({ tag: "Caching" }, c.yellow(taskName), validationResult.result);

	if (validationResult.result === "not-cacheable") {
		await execute();
	} else if (validationResult.result === "up-to-date") {
		// Do nothing, the task is up-to-date
	} else if (validationResult.result === "restore-from-cache") {
		// TODO: Implement cache restore logic
		await execute();
	} else if (validationResult.result === "cache-miss") {
		nadle.logger.info("Reasons:");

		for (const reason of validationResult.reasons) {
			nadle.logger.info(`  - ${CacheMissReason.toString(reason)}`);
		}

		await execute();

		await cacheValidator.update(validationResult);
	} else {
		throw new Error(`Unexpected cache validation result: ${validationResult}`);
	}
};

interface Injector<T> {
	apply: () => T;
	restore: () => T;
}

function createEnvironmentInjector(originalEnv: NodeJS.ProcessEnv, taskEnv: TaskEnv | undefined): Injector<void> {
	const serializedTaskEnv = Object.fromEntries(Object.entries(taskEnv ?? {}).map(([key, val]) => [key, String(val)]));

	return {
		apply() {
			Object.assign(process.env, { ...originalEnv, ...taskEnv });
		},
		restore() {
			for (const [key] of Object.entries(serializedTaskEnv)) {
				delete process.env[key];

				if (Object.hasOwn(originalEnv, key)) {
					process.env[key] = originalEnv[key];
				}
			}
		}
	};
}
