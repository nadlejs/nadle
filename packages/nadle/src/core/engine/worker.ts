import Path from "node:path";
import WorkerThreads from "node:worker_threads";

import c from "tinyrainbow";
import { getWorkspaceById } from "@nadle/project-resolver";

import { Nadle } from "../nadle.js";
import { bindObject } from "../utilities/utils.js";
import { type RunnerContext } from "../interfaces/task.js";
import { type NadleResolvedOptions } from "../options/types.js";
import { CacheMissReason } from "../models/cache/cache-miss-reason.js";
import { CacheValidator, type CacheValidationResult } from "../caching/cache-validator.js";
import { type TaskEnv, type TaskConfiguration } from "../interfaces/task-configuration.js";

// In a worker thread this is the real thread id (>= 1). In the main process
// (inline path) it is 0; map it to 1 so the reporter footer, which indexes
// running-task lines by threadId - 1, renders the single inline slot.
const threadId = WorkerThreads.threadId || 1;

export type WorkerMessage =
	| { readonly type: "start"; readonly threadId: number }
	| { readonly threadId: number; readonly type: "up-to-date"; readonly outputsFingerprint?: string }
	| { readonly threadId: number; readonly type: "from-cache"; readonly outputsFingerprint?: string };

/**
 * Delivers a lifecycle message to the TaskPool. In the pool path it posts to a
 * MessagePort (cross-thread); in the inline path it invokes the handler directly
 * in-process. Callers await it, so in the inline path the reporter has run before
 * the task body executes.
 */
export type Notifier = (message: WorkerMessage) => void | Promise<void>;

export interface WorkerParams {
	readonly taskId: string;
	readonly env: NodeJS.ProcessEnv;
	readonly options: NadleResolvedOptions;
	/** Present only on the pool path; injected by PoolExecutor for the worker thread. */
	readonly port?: WorkerThreads.MessagePort;
	readonly dependencyFingerprints: Record<string, string>;
}

let workerNadle: Nadle | null = null;

async function getOrCreateNadle(options: NadleResolvedOptions): Promise<Nadle> {
	if (!workerNadle) {
		workerNadle = await new Nadle({ ...options, tasks: [], excludedTasks: [] }).initForWorker(options);
	}

	return workerNadle;
}

export async function runTask(
	nadle: Nadle,
	{ taskId, options, env: originalEnv, dependencyFingerprints }: WorkerParams,
	notify: Notifier
): Promise<string | undefined> {
	const task = nadle.taskRegistry.getTaskById(taskId);
	const taskConfig = task.configResolver();
	const workspace = getWorkspaceById(options.project, task.workspaceId);
	const workingDir = Path.resolve(workspace.absolutePath, taskConfig.workingDir ?? "");
	const requested = options.tasks.some((resolvedTask) => resolvedTask.taskId === taskId);
	const passthroughArgs = requested ? options.passthroughArgs : [];

	const context: RunnerContext = {
		workingDir,
		passthroughArgs,
		logger: bindObject(nadle.logger, ["error", "warn", "log", "info", "debug", "getColumns"])
	};
	const taskOptions = typeof task.optionsResolver === "function" ? task.optionsResolver(context) : task.optionsResolver;
	const environmentInjector = createEnvironmentInjector(originalEnv, taskConfig.env);

	const cacheValidator = createCacheValidator(nadle, {
		taskId,
		taskConfig,
		workingDir,
		taskOptions,
		passthroughArgs,
		dependencyFingerprints,
		workspaceId: task.workspaceId
	});
	const validationResult = await cacheValidator.validate();

	nadle.logger.debug({ tag: "Caching" }, c.yellow(taskId), validationResult.result);

	if (nadle.options.why) {
		nadle.logger.log(explainCacheOutcome(task.label, validationResult));
	}

	const ctx: DispatchContext = { task, notify, context, taskOptions, environmentInjector };

	return dispatchByValidationResult({ ctx, nadle, cacheValidator, validationResult });
}

export default async (params: WorkerParams): Promise<string | undefined> => {
	const nadle = await getOrCreateNadle(params.options);
	const { port } = params;

	if (!port) {
		throw new Error("Worker thread invoked without a message port.");
	}

	const notify: Notifier = (message) => port.postMessage(message);

	return runTask(nadle, params, notify);
};

interface CacheValidatorParams {
	taskId: string;
	workingDir: string;
	workspaceId: string;
	taskOptions: unknown;
	taskConfig: TaskConfiguration;
	passthroughArgs: readonly string[];
	dependencyFingerprints: Record<string, string>;
}

function createCacheValidator(nadle: Nadle, params: CacheValidatorParams) {
	const rootConfigFile = nadle.options.project.rootWorkspace.configFilePath;
	const workspace = getWorkspaceById(nadle.options.project, params.workspaceId);
	const configFiles = workspace.configFilePath ? [rootConfigFile, workspace.configFilePath] : [rootConfigFile];

	// Override the global options value with the per-task one: dependency tasks must
	// keep a stable cache key regardless of what was passed on the CLI.
	return new CacheValidator(params.taskId, params.taskConfig, {
		...nadle.options,
		configFiles,
		workingDir: params.workingDir,
		passthroughArgs: params.passthroughArgs,
		taskOptions: params.taskOptions as object | undefined,
		dependencyFingerprints: params.dependencyFingerprints,
		projectDir: nadle.options.project.rootWorkspace.absolutePath,
		maxCacheEntries: params.taskConfig.maxCacheEntries ?? nadle.options.maxCacheEntries
	});
}

interface DispatchContext {
	notify: Notifier;
	taskOptions: unknown;
	context: RunnerContext;
	environmentInjector: Injector<void>;
	task: ReturnType<Nadle["taskRegistry"]["getTaskById"]>;
}

interface DispatchParams {
	nadle: Nadle;
	ctx: DispatchContext;
	cacheValidator: CacheValidator;
	validationResult: Awaited<ReturnType<CacheValidator["validate"]>>;
}

async function dispatchByValidationResult({ ctx, nadle, cacheValidator, validationResult }: DispatchParams): Promise<string | undefined> {
	if (validationResult.result === "not-cacheable" || validationResult.result === "cache-disabled") {
		await executeTask(ctx);

		return undefined;
	}

	if (validationResult.result === "up-to-date") {
		const fp = validationResult.outputsFingerprint;
		await ctx.notify({ threadId, type: "up-to-date", outputsFingerprint: fp } satisfies WorkerMessage);

		return fp;
	}

	if (validationResult.result === "restore-from-cache") {
		try {
			await validationResult.restore();
		} catch {
			nadle.logger.warn(`  Cache restore failed, re-executing task`);
			await executeTask(ctx);
			const fp = await cacheValidator.update(validationResult);

			return fp;
		}

		await cacheValidator.update(validationResult);
		const fp = validationResult.outputsFingerprint;
		await ctx.notify({ threadId, type: "from-cache", outputsFingerprint: fp } satisfies WorkerMessage);

		return fp;
	}

	if (validationResult.result === "cache-miss") {
		for (const reason of validationResult.reasons) {
			nadle.logger.info(`  - ${CacheMissReason.toString(reason)}`);
		}

		await executeTask(ctx);
		const fp = await cacheValidator.update(validationResult);

		return fp;
	}

	throw new Error(`Unexpected cache validation result: ${validationResult}`);
}

async function executeTask(ctx: DispatchContext) {
	await ctx.notify({ threadId, type: "start" } satisfies WorkerMessage);
	ctx.environmentInjector.apply();

	try {
		await ctx.task.run({ context: ctx.context, options: ctx.taskOptions });
	} finally {
		// Restore even when the task throws: in the inline path this mutates the
		// main process's env, so a skipped restore would leak into later tasks.
		ctx.environmentInjector.restore();
	}
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

/**
 * Human-readable explanation of a task's cache outcome, emitted under `--why`.
 * Hit cases say so; a cache miss lists what changed (file/options/config) using
 * the reasons already computed by CacheValidator.
 */
function explainCacheOutcome(label: string, result: CacheValidationResult): string {
	const head = `${c.yellow("why")} ${c.bold(label)}:`;

	switch (result.result) {
		case "not-cacheable":
			return `${head} not cacheable (no inputs/outputs declared)`;
		case "cache-disabled":
			return `${head} caching disabled`;
		case "up-to-date":
			return `${head} ${c.green("up-to-date")} — inputs and outputs unchanged`;
		case "restore-from-cache":
			return `${head} ${c.green("restored from cache")} — inputs match a previous run`;
		case "cache-miss":
			return [
				`${head} ${c.red("cache miss")} — will run because:`,
				...result.reasons.map((reason) => `  - ${CacheMissReason.toString(reason)}`)
			].join("\n");
	}
}
