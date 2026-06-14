import { type Nadle } from "../nadle.js";
import { type ExecutionContext } from "../context.js";
import { TaskStatus } from "../interfaces/registered-task.js";
import { type TaskIdentifier } from "../models/task-identifier.js";
import { PoolExecutor, type Executor, InlineExecutor } from "./executor.js";
import { NadleError, TaskExecutionError } from "../utilities/nadle-error.js";
import { type Notifier, type WorkerParams, type WorkerMessage } from "./worker.js";

// It seems this is the error message thrown by TinyPool when a worker is terminated
// See: https://github.com/tinylibs/tinypool/blob/main/src/index.ts#L438
const TERMINATING_WORKER_ERROR = "Terminating worker thread";

function toTaskExecutionError(error: unknown, label: string): NadleError {
	if (error instanceof NadleError) {
		return error;
	}

	const message = error instanceof Error ? error.message : String(error);

	return new TaskExecutionError(`Task ${label} failed: ${message}`, { task: label, cause: error });
}

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

			throw toTaskExecutionError(error, task.label);
		}

		await Promise.all(Array.from(this.getNextReadyTasks(taskId)).map((readyTaskId) => this.pushTask(readyTaskId)));
	}

	private async executeWorker(taskId: string) {
		const task = this.context.taskRegistry.getTaskById(taskId);
		let executeType: "execute" | "up-to-date" | "from-cache" = "execute";

		const notify: Notifier = async (message: WorkerMessage) => {
			if (message.type === "start") {
				await this.context.eventEmitter.onTaskStart(task, message.threadId);
			} else if (message.type === "up-to-date") {
				executeType = "up-to-date";
			} else if (message.type === "from-cache") {
				executeType = "from-cache";
			}
		};

		const workerParams: WorkerParams = {
			taskId: task.id,
			env: process.env,
			options: { ...this.context.options, footer: false },
			dependencyFingerprints: this.collectDependencyFingerprints(taskId)
		};

		const outputsFingerprint = await this.executor.run(workerParams, notify);

		return { executeType, outputsFingerprint };
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
