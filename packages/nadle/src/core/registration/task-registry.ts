import c from "tinyrainbow";

import { TaskStatus, type RegisteredTask } from "./types.js";
import { TaskIdentifierResolver } from "./task-identifier-resolver.js";

export class TaskRegistry {
	private readonly registry = new Map<string, RegisteredTask>();
	/**
	 * The id of the workspace where tasks are registering.
	 */
	private workspaceId: string | null = null;

	public updateWorkspaceId(workspaceId: string) {
		this.workspaceId = workspaceId;
	}

	public register(task: RegisteredTask) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set. Please call updateWorkingDir() before registering tasks.");
		}

		const adjustNameTask = { ...task, name: TaskIdentifierResolver.create(this.workspaceId, task.name) };

		this.registry.set(adjustNameTask.name, adjustNameTask);
	}

	public has(name: string) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set. Please call updateWorkingDir() before registering tasks.");
		}

		return this.registry.has(TaskIdentifierResolver.create(this.workspaceId, name));
	}

	public getAll(): RegisteredTask[] {
		return [...this.registry.values()];
	}

	public getAllByName(): string[] {
		return this.getAll().map(({ name }) => name);
	}

	public findByName(taskName: string): RegisteredTask | undefined {
		return this.registry.get(taskName);
	}

	public getByName(taskName: string): RegisteredTask {
		const task = this.findByName(taskName);

		if (!task) {
			throw new Error(`Task ${c.bold(taskName)} not found`);
		}

		return task;
	}

	public onTaskStart(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.Running;
		task.result.startTime = Date.now();
	}

	public onTaskFinish(name: string) {
		const task = this.getByName(name);

		if (task.result.startTime === null) {
			throw new Error(`Task ${c.bold(name)} was not started properly`);
		}

		task.status = TaskStatus.Finished;
		task.result.duration = Date.now() - task.result.startTime;
	}

	public onTaskUpToDate(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.UpToDate;
	}

	public onTaskRestoreFromCache(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.FromCache;
	}

	public onTaskFailed(name: string) {
		const task = this.getByName(name);

		if (task.result.startTime === null) {
			throw new Error(`Task ${c.bold(name)} was not started properly`);
		}

		task.status = TaskStatus.Failed;
		task.result.duration = Date.now() - task.result.startTime;
	}

	public onTaskCanceled(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.Canceled;
	}

	public onTasksScheduled(names: string[]) {
		for (const name of names) {
			this.getByName(name).status = TaskStatus.Scheduled;
		}
	}
}

export const taskRegistry = new TaskRegistry();
