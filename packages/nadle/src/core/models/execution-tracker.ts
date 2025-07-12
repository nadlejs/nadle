import Perf from "node:perf_hooks";

import c from "tinyrainbow";

import { type Listener } from "../interfaces/listener.js";
import { type TaskIdentifier } from "./task-identifier.js";
import { TaskStatus, type RegisteredTask } from "../interfaces/registered-task.js";

const DURATION_UPDATE_INTERVAL_MS = 100;

export type TaskStats = Record<Exclude<TaskStatus, TaskStatus.Registered>, number>;

interface TaskState {
	/** Current status of the task. */
	status: TaskStatus;
	/** Duration of the task execution in milliseconds, or null if not finished. */
	duration: number | null;
	/** Start time of the task execution (epoch ms), or null if not started. */
	startTime: number | null;
}

export class ExecutionTracker implements Listener {
	public taskStats: TaskStats = {
		[TaskStatus.Failed]: 0,
		[TaskStatus.Running]: 0,
		[TaskStatus.Canceled]: 0,
		[TaskStatus.Finished]: 0,
		[TaskStatus.UpToDate]: 0,
		[TaskStatus.FromCache]: 0,
		[TaskStatus.Scheduled]: 0
	};
	private taskStates: Record<string, TaskState | undefined> = {};

	public duration = 0;
	public threadIdPerWorker: Record<string, number> = {};

	private durationInterval: NodeJS.Timeout | undefined = undefined;

	public getTaskState(taskId: TaskIdentifier): TaskState {
		return this.taskStates[taskId] ?? { duration: null, startTime: null, status: TaskStatus.Registered };
	}

	public getTaskStatus(taskId: TaskIdentifier): TaskStatus {
		return this.getTaskState(taskId).status;
	}

	public onExecutionStart() {
		const start = performance.now();

		this.durationInterval = setInterval(() => {
			this.duration = performance.now() - start;
		}, DURATION_UPDATE_INTERVAL_MS).unref();
	}

	public async onExecutionFinish() {
		clearInterval(this.durationInterval);
	}

	public async onExecutionFailed() {
		clearInterval(this.durationInterval);
	}

	public async onTaskStart(task: RegisteredTask, threadId: number) {
		this.threadIdPerWorker = { ...this.threadIdPerWorker, [task.id]: threadId };
		this.taskStats = { ...this.taskStats, [TaskStatus.Running]: ++this.taskStats[TaskStatus.Running] };
		this.updateTaskState(task, { startTime: true, status: TaskStatus.Running });
	}

	public async onTaskFinish(task: RegisteredTask) {
		this.taskStats = {
			...this.taskStats,
			[TaskStatus.Running]: --this.taskStats[TaskStatus.Running],
			[TaskStatus.Finished]: ++this.taskStats[TaskStatus.Finished]
		};
		this.updateTaskState(task, { duration: true, status: TaskStatus.Failed });
	}

	public async onTaskUpToDate(task: RegisteredTask) {
		this.taskStats = {
			...this.taskStats,
			[TaskStatus.Running]: --this.taskStats[TaskStatus.Running],
			[TaskStatus.UpToDate]: ++this.taskStats[TaskStatus.UpToDate]
		};
		this.updateTaskState(task, { status: TaskStatus.UpToDate });
	}

	public async onTaskRestoreFromCache(task: RegisteredTask) {
		this.taskStats = {
			...this.taskStats,
			[TaskStatus.Running]: --this.taskStats[TaskStatus.Running],
			[TaskStatus.FromCache]: ++this.taskStats[TaskStatus.FromCache]
		};
		this.updateTaskState(task, { status: TaskStatus.FromCache });
	}

	public async onTaskFailed(task: RegisteredTask) {
		this.taskStats = {
			...this.taskStats,
			[TaskStatus.Failed]: ++this.taskStats[TaskStatus.Failed],
			[TaskStatus.Running]: --this.taskStats[TaskStatus.Running]
		};
		this.updateTaskState(task, { duration: true, status: TaskStatus.Failed });
	}

	public async onTaskCanceled(task: RegisteredTask) {
		this.taskStats = {
			...this.taskStats,
			[TaskStatus.Running]: --this.taskStats[TaskStatus.Running],
			[TaskStatus.Canceled]: ++this.taskStats[TaskStatus.Canceled]
		};
		this.updateTaskState(task, { status: TaskStatus.Canceled });
	}

	public async onTasksScheduled(tasks: RegisteredTask[]) {
		this.taskStats = { ...this.taskStats, [TaskStatus.Scheduled]: tasks.length };

		for (const task of tasks) {
			this.updateTaskState(task, { status: TaskStatus.Scheduled });
		}
	}

	private updateTaskState(task: RegisteredTask, payload: Partial<{ duration: true; startTime: true; status: TaskStatus }>) {
		const taskState = this.taskStates[task.id] ?? { duration: null, startTime: null, status: TaskStatus.Registered };

		if (payload.status !== undefined) {
			taskState.status = payload.status;
		}

		if (payload.startTime === true) {
			taskState.startTime = Perf.performance.now();
		}

		if (payload.duration == true) {
			if (taskState.startTime === null) {
				throw new Error(`Task ${c.bold(task.id)} was not started properly`);
			}

			taskState.duration = Perf.performance.now() - taskState.startTime;
		}

		this.taskStates = { ...this.taskStates, [task.id]: taskState };
	}
}
