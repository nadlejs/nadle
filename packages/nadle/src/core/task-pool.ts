import TinyPool from "tinypool";

import { type Nadle } from "./nadle.js";
import { type WorkerParams } from "./worker.js";

export class TaskPool {
	private readonly pool: TinyPool;

	constructor(
		private readonly nadle: Nadle,
		private readonly getNextReadyTasks: (taskName?: string) => Set<string>
	) {
		this.pool = new TinyPool({
			concurrentTasksPerWorker: 1,
			minThreads: this.nadle.options.minWorkers,
			maxThreads: this.nadle.options.maxWorkers,
			filename: new URL("./worker.js", import.meta.url).href
		});
	}

	async run() {
		try {
			await Promise.all(Array.from(this.getNextReadyTasks()).map((taskName) => this.pushTask(taskName)));
		} finally {
			await this.pool.destroy();
		}
	}

	private async pushTask(taskName: string) {
		const task = this.nadle.registry.getByName(taskName);

		try {
			const { port2: poolPort, port1: workerPort } = new MessageChannel();
			poolPort.on("message", async (msg) => {
				if (msg.type === "start") {
					await this.nadle.onTaskStart(task, msg.threadId);
				}
			});

			const workerParams: WorkerParams = {
				port: workerPort,
				env: process.env,
				taskName: task.name,
				options: { ...this.nadle.options, showSummary: false, isWorkerThread: true }
			};

			await this.pool.run(workerParams, { transferList: [workerPort] });

			await this.nadle.onTaskFinish(task);
		} catch (error) {
			await this.nadle.onTaskFailed(task);
			throw error;
		}

		await Promise.all(Array.from(this.getNextReadyTasks(taskName)).map((taskName) => this.pushTask(taskName)));
	}
}
