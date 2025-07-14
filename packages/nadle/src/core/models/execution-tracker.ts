import Perf from "node:perf_hooks";

import { type Listener } from "../interfaces/listener.js";
import { type TaskIdentifier } from "./task-identifier.js";
import { TaskStatus, type RegisteredTask } from "../interfaces/registered-task.js";

const DURATION_UPDATE_INTERVAL_MS = 100;

export type TaskStats = Record<Exclude<TaskStatus, TaskStatus.Registered>, number>;

interface TaskState extends Pick<RegisteredTask, "id" | "label"> {
	/** Current status of the task. */
	status: TaskStatus;
	/** Duration of the task execution in milliseconds, or null if not finished. */
	duration: number | null;
	/** Start time of the task execution (epoch ms), or null if not started. */
	startTime: number | null;

	/** Thread ID where the task is running, or null if not applicable. */
	threadId: number | null;
}

const defaultTaskState: TaskState = { id: "", label: "", duration: null, threadId: null, startTime: null, status: TaskStatus.Registered };

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
	public duration = 0;

	private taskStates: Record<string, TaskState | undefined> = {};
	private durationInterval: NodeJS.Timeout | undefined = undefined;

	public getTaskStateByStatus(status: TaskStatus): TaskState[] {
		return Object.entries(this.taskStates).flatMap(([_, state]) => (state?.status === status ? state : []));
	}

	public getTaskState(taskId: TaskIdentifier): TaskState {
		return this.taskStates[taskId] ?? defaultTaskState;
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
		this.updateTaskState(task, { threadId, startTime: true, status: TaskStatus.Running });
	}

	public async onTaskFinish(task: RegisteredTask) {
		this.updateTaskState(task, { duration: true, status: TaskStatus.Finished });
	}

	public async onTaskUpToDate(task: RegisteredTask) {
		this.updateTaskState(task, { status: TaskStatus.UpToDate });
	}

	public async onTaskRestoreFromCache(task: RegisteredTask) {
		this.updateTaskState(task, { status: TaskStatus.FromCache });
	}

	public async onTaskFailed(task: RegisteredTask) {
		this.updateTaskState(task, { duration: true, status: TaskStatus.Failed });
	}

	public async onTaskCanceled(task: RegisteredTask) {
		this.updateTaskState(task, { status: TaskStatus.Canceled });
	}

	public async onTasksScheduled(tasks: RegisteredTask[]) {
		this.taskStats = { ...this.taskStats, [TaskStatus.Scheduled]: tasks.length };

		for (const task of tasks) {
			const { id, label } = task;
			this.taskStates = { ...this.taskStates, [task.id]: { ...defaultTaskState, id, label, status: TaskStatus.Scheduled } };
		}
	}

	private updateTaskState(
		task: RegisteredTask,
		payload: Partial<{ duration: true; startTime: true; threadId: number; status: Exclude<TaskStatus, TaskStatus.Registered> }>
	) {
		const taskState = this.taskStates[task.id];

		if (!taskState) {
			throw new Error(`Task ${task.label} is not registered in the execution tracker.`);
		}

		const { status, threadId, duration, startTime } = payload;

		if (status !== undefined) {
			taskState.status = status;
			this.taskStats = { ...this.taskStats, [status]: ++this.taskStats[status] };

			if (
				status === TaskStatus.Failed ||
				status === TaskStatus.Finished ||
				status === TaskStatus.Canceled ||
				status === TaskStatus.UpToDate ||
				status === TaskStatus.FromCache
			) {
				this.taskStats = { ...this.taskStats, [TaskStatus.Running]: --this.taskStats[TaskStatus.Running] };
			}
		}

		if (threadId !== undefined) {
			taskState.threadId = threadId;
		}

		if (startTime) {
			taskState.startTime = Perf.performance.now();
		}

		if (duration) {
			if (taskState.startTime === null) {
				throw new Error(`Task ${task.label} was not started properly`);
			}

			taskState.duration = Perf.performance.now() - taskState.startTime;
		}
	}
}
