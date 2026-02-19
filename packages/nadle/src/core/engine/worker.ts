import Path from "node:path";
import WorkerThreads from "node:worker_threads";

import c from "tinyrainbow";

import { Nadle } from "../nadle.js";
import { bindObject } from "../utilities/utils.js";
import { Project } from "../models/project/project.js";
import { type RunnerContext } from "../interfaces/task.js";
import { CacheValidator } from "../caching/cache-validator.js";
import { type NadleResolvedOptions } from "../options/types.js";
import { CacheMissReason } from "../models/cache/cache-miss-reason.js";
import { type TaskEnv, type TaskConfiguration } from "../interfaces/task-configuration.js";

const threadId = WorkerThreads.threadId;

export type WorkerMessage =
	| { readonly type: "start"; readonly threadId: number }
	| { readonly threadId: number; readonly type: "up-to-date" }
	| { readonly threadId: number; readonly type: "from-cache" };

export interface WorkerParams {
	readonly taskId: string;
	readonly env: NodeJS.ProcessEnv;
	readonly options: NadleResolvedOptions;
	readonly port: WorkerThreads.MessagePort;
}

let workerNadle: Nadle | null = null;

async function getOrCreateNadle(options: NadleResolvedOptions): Promise<Nadle> {
	if (!workerNadle) {
		workerNadle = await new Nadle({ ...options, tasks: [], excludedTasks: [] }).initForWorker(options);
	}

	return workerNadle;
}

export default async ({ port, taskId, options, env: originalEnv }: WorkerParams) => {
	const nadle = await getOrCreateNadle(options);
	const task = nadle.taskRegistry.getTaskById(taskId);
	const taskConfig = task.configResolver();
	const workspace = Project.getWorkspaceById(options.project, task.workspaceId);
	const workingDir = Path.resolve(workspace.absolutePath, taskConfig.workingDir ?? "");

	const context: RunnerContext = {
		workingDir,
		logger: bindObject(nadle.logger, ["error", "warn", "log", "info", "debug", "getColumns", "throw"])
	};
	const taskOptions = typeof task.optionsResolver === "function" ? task.optionsResolver(context) : task.optionsResolver;
	const environmentInjector = createEnvironmentInjector(originalEnv, taskConfig.env);

	const cacheValidator = createCacheValidator(nadle, { taskId, taskConfig, workingDir, workspaceId: task.workspaceId });
	const validationResult = await cacheValidator.validate();

	nadle.logger.debug({ tag: "Caching" }, c.yellow(taskId), validationResult.result);

	const ctx: DispatchContext = { port, task, context, taskOptions, environmentInjector };
	await dispatchByValidationResult({ ctx, nadle, cacheValidator, validationResult });
};

interface CacheValidatorParams {
	taskId: string;
	workingDir: string;
	workspaceId: string;
	taskConfig: TaskConfiguration;
}

function createCacheValidator(nadle: Nadle, params: CacheValidatorParams) {
	const rootConfigFile = nadle.options.project.rootWorkspace.configFilePath;
	const workspace = Project.getWorkspaceById(nadle.options.project, params.workspaceId);
	const configFiles = workspace.configFilePath ? [rootConfigFile, workspace.configFilePath] : [rootConfigFile];

	return new CacheValidator(params.taskId, params.taskConfig, {
		configFiles,
		workingDir: params.workingDir,
		projectDir: nadle.options.project.rootWorkspace.absolutePath,
		...nadle.options
	});
}

interface DispatchContext {
	taskOptions: unknown;
	context: RunnerContext;
	port: WorkerThreads.MessagePort;
	environmentInjector: Injector<void>;
	task: ReturnType<Nadle["taskRegistry"]["getTaskById"]>;
}

interface DispatchParams {
	nadle: Nadle;
	ctx: DispatchContext;
	cacheValidator: CacheValidator;
	validationResult: Awaited<ReturnType<CacheValidator["validate"]>>;
}

async function dispatchByValidationResult({ ctx, nadle, cacheValidator, validationResult }: DispatchParams) {
	if (validationResult.result === "not-cacheable" || validationResult.result === "cache-disabled") {
		await executeTask(ctx);
	} else if (validationResult.result === "up-to-date") {
		ctx.port.postMessage({ threadId, type: "up-to-date" } satisfies WorkerMessage);
	} else if (validationResult.result === "restore-from-cache") {
		await validationResult.restore();
		await cacheValidator.update(validationResult);
		ctx.port.postMessage({ threadId, type: "from-cache" } satisfies WorkerMessage);
	} else if (validationResult.result === "cache-miss") {
		for (const reason of validationResult.reasons) {
			nadle.logger.info(`  - ${CacheMissReason.toString(reason)}`);
		}

		await executeTask(ctx);
		await cacheValidator.update(validationResult);
	} else {
		throw new Error(`Unexpected cache validation result: ${validationResult}`);
	}
}

async function executeTask(ctx: DispatchContext) {
	ctx.port.postMessage({ threadId, type: "start" } satisfies WorkerMessage);
	ctx.environmentInjector.apply();
	await ctx.task.run({ context: ctx.context, options: ctx.taskOptions });
	ctx.environmentInjector.restore();
}

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
