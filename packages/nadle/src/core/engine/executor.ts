import type WorkerThreads from "node:worker_threads";

import TinyPool from "tinypool";

import { type Nadle } from "../nadle.js";
import { runTask, type WorkerParams } from "./worker.js";

/**
 * Runs a single task and resolves with its outputs fingerprint (or undefined).
 * Implementations post lifecycle messages (start / up-to-date / from-cache) to
 * `params.port`, which the TaskPool listens on.
 */
export interface Executor {
	destroy(): Promise<void>;
	run(params: WorkerParams, workerPort: WorkerThreads.MessagePort): Promise<string | undefined>;
}

/**
 * Default executor: runs each task in a tinypool worker thread.
 * Used whenever maxWorkers > 1.
 */
export class PoolExecutor implements Executor {
	private readonly pool: TinyPool;

	public constructor(params: { minThreads: number; maxThreads: number }) {
		this.pool = new TinyPool({
			concurrentTasksPerWorker: 1,
			minThreads: params.minThreads,
			maxThreads: params.maxThreads,
			filename: new URL("./worker.js", import.meta.url).href
		});
	}

	public run(params: WorkerParams, workerPort: WorkerThreads.MessagePort): Promise<string | undefined> {
		return this.pool.run(params, { transferList: [workerPort] }) as Promise<string | undefined>;
	}

	public async destroy(): Promise<void> {
		await this.pool.destroy();
	}
}

/**
 * In-process executor: runs each task directly in the main process, reusing the
 * already-initialized main Nadle. Used when maxWorkers === 1. Avoids a worker
 * thread spawn and a second config transpile.
 */
export class InlineExecutor implements Executor {
	public constructor(private readonly nadle: Nadle) {}

	public run(params: WorkerParams): Promise<string | undefined> {
		return runTask(this.nadle, params);
	}

	public async destroy(): Promise<void> {
		// No resources to release.
	}
}
