import Path from "node:path";
import Fs from "node:fs/promises";
import { threadId, type MessagePort } from "node:worker_threads";

import { glob } from "glob";
import c from "tinyrainbow";

import { Nadle } from "./nadle.js";
import { taskRegistry } from "./task-registry.js";
import { type NadleResolvedOptions } from "./options/index.js";
import { type Context, type FileDeclarations } from "./types.js";

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

	port.postMessage({ threadId, type: "start", taskName: name });
	await new Promise((resolve) => setImmediate(resolve));
	await new Promise((resolve) => process.nextTick(resolve));

	const taskConfig = task.configResolver({ context });
	const taskEnv = Object.fromEntries(Object.entries(taskConfig.env ?? {}).map(([key, val]) => [key, String(val)]));
	const workingDir = taskConfig.workingDir ? Path.resolve(taskConfig.workingDir) : process.cwd();
	const inputs = await resolveFileDeclarations(workingDir, taskConfig.inputs);

	if (taskConfig.inputs !== undefined) {
		nadle.logger.info(`${c.yellow(name)} inputs:`, printArray(inputs));
	}

	Object.assign(process.env, { ...originalEnv, ...taskEnv });

	await task.run({ options: taskOptions, context: { ...context, workingDir } });

	const outputs = await resolveFileDeclarations(workingDir, taskConfig.outputs);

	if (taskConfig.outputs !== undefined) {
		nadle.logger.info(`${c.yellow(name)} outputs:`, printArray(outputs));
	}

	for (const [key] of Object.entries(taskEnv)) {
		delete process.env[key];

		if (Object.hasOwn(originalEnv, key)) {
			process.env[key] = originalEnv[key];
		}
	}
};

const collator = new Intl.Collator(undefined, { sensitivity: "base" });

async function resolveFileDeclarations(workingDir: string, declarations: FileDeclarations | undefined) {
	const normalizedDeclarations = await Promise.all((declarations ?? []).map((declaration) => normalizeToGlob(workingDir, declaration)));

	const files = await glob(normalizedDeclarations, { nodir: true, absolute: true, cwd: workingDir });

	return files.sort(collator.compare);
}

function printArray(array: unknown[]) {
	if (array.length === 0) {
		return "[]";
	}

	return array.join(", ");
}

async function normalizeToGlob(workingDir: string, path: string): Promise<string> {
	const fullPath = Path.resolve(workingDir, path);

	try {
		const stats = await Fs.stat(fullPath);

		if (stats.isDirectory()) {
			return Path.join(path, "**/*");
		}
	} catch {
		// File doesn't exist or is a glob pattern — return as-is
	}

	return path;
}
