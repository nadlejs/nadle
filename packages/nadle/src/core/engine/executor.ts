import WorkerThreads from "node:worker_threads";

import TinyPool from "tinypool";

import { type Nadle } from "../nadle.js";
import { runTask, type Notifier, type WorkerParams, type WorkerMessage } from "./worker.js";

/**
 * Runs a single task and resolves with its outputs fingerprint (or undefined).
 * Lifecycle messages (start / up-to-date / from-cache) are delivered to `notify`.
 * Each implementation owns its own transport: the pool path posts across a
 * MessagePort, the inline path invokes `notify` directly in-process.
 */
export interface Executor {
	destroy(): Promise<void>;
	run(params: WorkerParams, notify: Notifier): Promise<string | undefined>;
}

/**
 * Default executor: runs each task in a tinypool worker thread. Used whenever
 * maxWorkers > 1. Owns a MessageChannel so the worker thread can report lifecycle
 * messages back across the thread boundary.
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

	public async run(params: WorkerParams, notify: Notifier): Promise<string | undefined> {
		const { port2: poolPort, port1: workerPort } = new WorkerThreads.MessageChannel();
		let resolveMessageReceived: () => void;
		const messageReceived = new Promise<void>((resolve) => {
			resolveMessageReceived = resolve;
		});

		poolPort.on("message", async (message: WorkerMessage) => {
			try {
				await notify(message);
			} finally {
				resolveMessageReceived();
			}
		});

		try {
			const outputsFingerprint = (await this.pool.run({ ...params, port: workerPort }, { transferList: [workerPort] })) as string | undefined;
			await messageReceived;

			return outputsFingerprint;
		} finally {
			poolPort.close();
		}
	}

	public async destroy(): Promise<void> {
		await this.pool.destroy();
	}
}

/**
 * In-process executor: runs each task directly in the main process, reusing the
 * already-initialized main Nadle. Used when maxWorkers === 1. Avoids a worker
 * thread spawn and a second config transpile. Delivers lifecycle messages by
 * invoking `notify` directly, so no MessagePort is involved.
 */
export class InlineExecutor implements Executor {
	public constructor(private readonly nadle: Nadle) {}

	public run(params: WorkerParams, notify: Notifier): Promise<string | undefined> {
		return runTask(this.nadle, params, notify);
	}

	public async destroy(): Promise<void> {
		// No resources to release.
	}
}
