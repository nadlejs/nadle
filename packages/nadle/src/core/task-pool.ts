import Os from "node:os";

import TinyPool from "tinypool";

import { type Nadle } from "./nadle.js";
import { type WorkerParams } from "./worker.js";

export class TaskPool {
	private readonly pool: TinyPool;
	private readonly maxThreads: number;
	private readonly minThreads: number;

	constructor(
		private readonly nadle: Nadle,
		private readonly getNextReadyTasks: (taskName?: string) => Set<string>
	) {
		this.maxThreads = resolveWorkerCount(this.nadle.options.maxWorkers);
		this.minThreads = Math.min(resolveWorkerCount(this.nadle.options.minWorkers), this.maxThreads);

		this.nadle.logger.info(`Maximum threads: ${this.maxThreads}`);
		this.nadle.logger.info(`Minimum threads: ${this.minThreads}`);

		this.pool = new TinyPool({
			minThreads: this.minThreads,
			maxThreads: this.maxThreads,
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
					await this.nadle.onTaskStart(task);

					return;
				}
			});

			const workerParams: WorkerParams = {
				name: task.name,
				port: workerPort,
				options: { ...this.nadle.options, logLevel: "error", showSummary: false }
			};

			await this.nadle.onTaskQueued(task);

			await this.pool.run(workerParams, { transferList: [workerPort] });

			await this.nadle.onTaskFinish(task);
		} catch (error) {
			await this.nadle.onTaskFailed(task);
			throw error;
		}

		await Promise.all(Array.from(this.getNextReadyTasks(taskName)).map((taskName) => this.pushTask(taskName)));
	}
}

function resolveWorkerCount(configValue: string | number | undefined) {
	if (configValue === undefined) {
		return Math.max(getMaxWorkersCount() - 1, 1);
	}

	if (typeof configValue === "number") {
		return configValue;
	}

	if (typeof configValue === "string") {
		return getWorkersCountByPercentage(configValue);
	}

	throw new Error(`Invalid worker value: ${configValue}`);
}

function getWorkersCountByPercentage(percent: string): number {
	const maxWorkersCount = getMaxWorkersCount();
	const workersCountByPercentage = Math.round((Number.parseInt(percent) / 100) * maxWorkersCount);

	return Math.max(1, Math.min(maxWorkersCount, workersCountByPercentage));
}

function getMaxWorkersCount() {
	return typeof Os.availableParallelism === "function" ? Os.availableParallelism() : Os.cpus().length;
}
