import Path from "node:path";
import WorkerThreads from "node:worker_threads";

import c from "tinyrainbow";

import { Nadle } from "../nadle.js";
import { bindObject } from "../utilities/utils.js";
import { type TaskEnv, type RunnerContext } from "../types.js";
import { CacheValidator } from "../caching/cache-validator.js";
import { taskRegistry } from "../registration/task-registry.js";
import { type NadleResolvedOptions } from "../options/types.js";
import { CacheMissReason } from "../caching/cache-miss-reason.js";

const threadId = WorkerThreads.threadId;

export interface WorkerParams {
	readonly taskId: string;
	readonly env: NodeJS.ProcessEnv;
	readonly options: NadleResolvedOptions;
	readonly port: WorkerThreads.MessagePort;
}

export default async ({ port, taskId, options, env: originalEnv }: WorkerParams) => {
	const nadle = await new Nadle(options).init();

	const task = taskRegistry.getById(taskId);
	const { configResolver, optionsResolver } = task;

	const taskConfig = configResolver();
	const workingDir = Path.resolve(options.project.rootWorkspace.absolutePath, taskConfig.workingDir ?? "");

	const context: RunnerContext = {
		workingDir,
		logger: bindObject(nadle.logger, ["error", "warn", "log", "info", "debug"])
	};
	const taskOptions = typeof optionsResolver === "function" ? optionsResolver(context) : optionsResolver;

	const environmentInjector = createEnvironmentInjector(originalEnv, taskConfig.env);

	const cacheValidator = new CacheValidator(taskId, taskConfig, {
		workingDir,
		projectDir: nadle.options.project.rootWorkspace.absolutePath,
		...nadle.options
	});
	const validationResult = await cacheValidator.validate();

	const execute = async () => {
		port.postMessage({ threadId, type: "start" });

		environmentInjector.apply();

		await task.run({ context, options: taskOptions });

		environmentInjector.restore();
	};

	nadle.logger.debug({ tag: "Caching" }, c.yellow(taskId), validationResult.result);

	if (validationResult.result === "not-cacheable" || validationResult.result === "cache-disabled") {
		await execute();
	} else if (validationResult.result === "up-to-date") {
		port.postMessage({ threadId, type: "up-to-date" });
		// Do nothing, the task is up-to-date
	} else if (validationResult.result === "restore-from-cache") {
		await validationResult.restore();

		await cacheValidator.update(validationResult);
		port.postMessage({ threadId, type: "from-cache" });
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
