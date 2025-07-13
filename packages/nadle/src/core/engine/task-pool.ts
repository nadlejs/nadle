import TinyPool from "tinypool";

import { type Nadle } from "../nadle.js";
import { type WorkerParams } from "./worker.js";
import { TaskStatus } from "../interfaces/registered-task.js";
import { type TaskIdentifier } from "../models/task-identifier.js";

// It seems this is the error message thrown by TinyPool when a worker is terminated
// See: https://github.com/tinylibs/tinypool/blob/main/src/index.ts#L438
const TERMINATING_WORKER_ERROR = "Terminating worker thread";

export class TaskPool {
	private readonly pool: TinyPool;

	public constructor(
		private readonly nadle: Nadle,
		private readonly getNextReadyTasks: (taskId?: TaskIdentifier) => Set<TaskIdentifier>
	) {
		this.pool = new TinyPool({
			concurrentTasksPerWorker: 1,
			minThreads: this.nadle.options.minWorkers,
			maxThreads: this.nadle.options.maxWorkers,
			filename: new URL("./worker.js", import.meta.url).href
		});
	}

	public async run() {
		try {
			await Promise.all(Array.from(this.getNextReadyTasks()).map((taskId) => this.pushTask(taskId)));
		} finally {
			await this.pool.destroy();
		}
	}

	private async pushTask(taskId: string) {
		const task = this.nadle.taskRegistry.getTaskById(taskId);

		try {
			const { port2: poolPort, port1: workerPort } = new MessageChannel();
			let executeType: "execute" | "up-to-date" | "from-cache" = "execute";
			// TODO: Add type for the message
			poolPort.on("message", async (msg: any) => {
				if (msg.type === "start") {
					await this.nadle.eventEmitter.onTaskStart(task, msg.threadId);
				} else if (msg.type === "up-to-date") {
					executeType = "up-to-date";
				} else if (msg.type === "from-cache") {
					executeType = "from-cache";
				}
			});

			const workerParams: WorkerParams = {
				taskId: task.id,
				port: workerPort,
				env: process.env,
				options: { ...this.nadle.options, footer: false, isWorkerThread: true }
			};

			await this.pool.run(workerParams, { transferList: [workerPort] });

			if (executeType === "execute") {
				await this.nadle.eventEmitter.onTaskFinish(task);
			} else if (executeType === "up-to-date") {
				await this.nadle.eventEmitter.onTaskUpToDate(task);
			} else if (executeType === "from-cache") {
				await this.nadle.eventEmitter.onTaskRestoreFromCache(task);
			} else {
				throw new Error(`Unknown execute type: ${executeType}`);
			}
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === TERMINATING_WORKER_ERROR &&
				this.nadle.executionTracker.getTaskStatus(task.id) === TaskStatus.Running
			) {
				await this.nadle.eventEmitter.onTaskCanceled(task);

				return;
			}

			await this.nadle.eventEmitter.onTaskFailed(task);
			throw error;
		}

		await Promise.all(Array.from(this.getNextReadyTasks(taskId)).map((readyTaskId) => this.pushTask(readyTaskId)));
	}
}
