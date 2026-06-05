import { type Nadle } from "../nadle.js";
import { type ExecutionContext } from "../context.js";
import { TaskStatus } from "../interfaces/registered-task.js";
import { type TaskIdentifier } from "../models/task-identifier.js";
import { type WorkerParams, type WorkerMessage } from "./worker.js";
import { PoolExecutor, type Executor, InlineExecutor } from "./executor.js";

// It seems this is the error message thrown by TinyPool when a worker is terminated
// See: https://github.com/tinylibs/tinypool/blob/main/src/index.ts#L438
const TERMINATING_WORKER_ERROR = "Terminating worker thread";

export class TaskPool {
	private readonly executor: Executor;
	private readonly outputFingerprints = new Map<TaskIdentifier, string>();

	public constructor(
		private readonly context: ExecutionContext,
		private readonly getNextReadyTasks: (taskId?: TaskIdentifier) => Set<TaskIdentifier>
	) {
		const { minWorkers, maxWorkers } = this.context.options;

		this.executor =
			maxWorkers === 1 ? new InlineExecutor(this.context as unknown as Nadle) : new PoolExecutor({ minThreads: minWorkers, maxThreads: maxWorkers });
	}

	public async run() {
		try {
			await Promise.all(Array.from(this.getNextReadyTasks()).map((taskId) => this.pushTask(taskId)));
		} finally {
			await this.executor.destroy();
		}
	}

	private async pushTask(taskId: string) {
		const task = this.context.taskRegistry.getTaskById(taskId);

		try {
			const { executeType, outputsFingerprint } = await this.executeWorker(taskId);

			if (outputsFingerprint) {
				this.outputFingerprints.set(taskId, outputsFingerprint);
			}

			if (executeType === "execute") {
				await this.context.eventEmitter.onTaskFinish(task);
			} else if (executeType === "up-to-date") {
				await this.context.eventEmitter.onTaskUpToDate(task);
			} else if (executeType === "from-cache") {
				await this.context.eventEmitter.onTaskRestoreFromCache(task);
			} else {
				throw new Error(`Unknown execute type: ${executeType}`);
			}
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === TERMINATING_WORKER_ERROR &&
				this.context.executionTracker.getTaskStatus(task.id) === TaskStatus.Running
			) {
				await this.context.eventEmitter.onTaskCanceled(task);

				return;
			}

			await this.context.eventEmitter.onTaskFailed(task);
			throw error;
		}

		await Promise.all(Array.from(this.getNextReadyTasks(taskId)).map((readyTaskId) => this.pushTask(readyTaskId)));
	}

	private async executeWorker(taskId: string) {
		const task = this.context.taskRegistry.getTaskById(taskId);
		const { port2: poolPort, port1: workerPort } = new MessageChannel();
		let executeType: "execute" | "up-to-date" | "from-cache" = "execute";
		let resolveMessageReceived: () => void;
		const messageReceived = new Promise<void>((r) => {
			resolveMessageReceived = r;
		});
		poolPort.on("message", async (msg: WorkerMessage) => {
			if (msg.type === "start") {
				await this.context.eventEmitter.onTaskStart(task, msg.threadId);
			} else if (msg.type === "up-to-date") {
				executeType = "up-to-date";
			} else if (msg.type === "from-cache") {
				executeType = "from-cache";
			}

			resolveMessageReceived();
		});

		const workerParams: WorkerParams = {
			taskId: task.id,
			port: workerPort,
			env: process.env,
			options: { ...this.context.options, footer: false },
			dependencyFingerprints: this.collectDependencyFingerprints(taskId)
		};

		try {
			const outputsFingerprint = await this.executor.run(workerParams, workerPort);
			await messageReceived;

			return { executeType, outputsFingerprint };
		} finally {
			// Close both ports so the channel does not keep the event loop alive.
			// In the pool path the worker port is transferred to the thread (closing
			// it here is a no-op); in the inline path both ports live in this process
			// and must be closed or the CLI never exits.
			poolPort.close();
			workerPort.close();
		}
	}

	private collectDependencyFingerprints(taskId: TaskIdentifier): Record<string, string> {
		const deps = this.context.taskScheduler.getDirectDependencies(taskId);
		const fingerprints: Record<string, string> = {};

		for (const depId of deps) {
			const fp = this.outputFingerprints.get(depId);

			if (fp) {
				fingerprints[depId] = fp;
			}
		}

		return fingerprints;
	}
}
