import c from "tinyrainbow";

import { TaskIdentifier } from "./task-identifier.js";
import { TaskStatus, type RegisteredTask } from "./types.js";

export class TaskRegistry {
	private readonly registry = new Map<TaskIdentifier, RegisteredTask>();
	/**
	 * The id of the workspace where tasks are registering.
	 */
	private workspaceId: string | null = null;

	public updateWorkspaceId(workspaceId: string) {
		this.workspaceId = workspaceId;
	}

	public register(name: string, task: Omit<RegisteredTask, "id" | "label">) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set. Please call updateWorkingDir() before registering tasks.");
		}

		const id = TaskIdentifier.create(this.workspaceId, name);
		const label = TaskIdentifier.getLabel(id);

		this.registry.set(id, { ...task, id, label });
	}

	public has(taskName: string) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set. Please call updateWorkingDir() before registering tasks.");
		}

		return this.registry.has(TaskIdentifier.create(this.workspaceId, taskName));
	}

	public getAll(): RegisteredTask[] {
		return [...this.registry.values()];
	}

	public getAllTaskIds(): string[] {
		return this.getAll().map(({ id }) => id);
	}

	public getByName(taskName: string): RegisteredTask[] {
		return this.getAll().filter(({ id }) => TaskIdentifier.resolve(id).taskName === taskName);
	}

	public getById(taskId: TaskIdentifier): RegisteredTask {
		const task = this.findById(taskId);

		if (!task) {
			throw new Error(`Task ${c.bold(taskId)} not found`);
		}

		return task;
	}

	private findById(taskId: TaskIdentifier): RegisteredTask | undefined {
		return this.registry.get(taskId);
	}

	public onTaskStart(id: TaskIdentifier) {
		const task = this.getById(id);

		task.status = TaskStatus.Running;
		task.result.startTime = Date.now();
	}

	public onTaskFinish(id: TaskIdentifier) {
		const task = this.getById(id);

		if (task.result.startTime === null) {
			throw new Error(`Task ${c.bold(id)} was not started properly`);
		}

		task.status = TaskStatus.Finished;
		task.result.duration = Date.now() - task.result.startTime;
	}

	public onTaskUpToDate(id: TaskIdentifier) {
		this.getById(id).status = TaskStatus.UpToDate;
	}

	public onTaskRestoreFromCache(id: TaskIdentifier) {
		this.getById(id).status = TaskStatus.FromCache;
	}

	public onTaskFailed(id: TaskIdentifier) {
		const task = this.getById(id);

		if (task.result.startTime === null) {
			throw new Error(`Task ${c.bold(id)} was not started properly`);
		}

		task.status = TaskStatus.Failed;
		task.result.duration = Date.now() - task.result.startTime;
	}

	public onTaskCanceled(id: TaskIdentifier) {
		const task = this.getById(id);

		task.status = TaskStatus.Canceled;
	}

	public onTasksScheduled(ids: TaskIdentifier[]) {
		for (const id of ids) {
			this.getById(id).status = TaskStatus.Scheduled;
		}
	}
}

export const taskRegistry = new TaskRegistry();
