import c from "tinyrainbow";

import { TaskStatus, type RegisteredTask } from "./types.js";

export class TaskRegistry {
	private readonly registry = new Map<string, RegisteredTask>();

	public register(name: string, task: RegisteredTask) {
		this.registry.set(name, task);
	}

	public has(name: string) {
		return this.registry.has(name);
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

		task.status = TaskStatus.Finished;
		task.result.duration = Date.now() - (task.result.startTime ?? 0);
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

		task.status = TaskStatus.Failed;
		task.result.duration = Date.now() - (task.result.startTime ?? 0);
	}

	public onTasksScheduled(names: string[]) {
		for (const name of names) {
			this.getByName(name).status = TaskStatus.Scheduled;
		}
	}
}

export const taskRegistry = new TaskRegistry();
