import c from "tinyrainbow";

import { TaskStatus, type RegisteredTask } from "./types.js";

console.log("@@@", import.meta.dirname);

export class TaskRegistry {
	public readonly registry = new Map<string, RegisteredTask>();

	constructor(public id: number) {}

	register(name: string, task: RegisteredTask) {
		console.log(`registering task id = ${this.id}`, name, task);
		this.registry.set(name, task);
		console.log(`registeddd ${Array.from(this.registry.keys())}`);
	}

	has(name: string) {
		return this.registry.has(name);
	}

	getAll(): RegisteredTask[] {
		return [...this.registry.values()];
	}

	findByName(taskName: string): RegisteredTask | undefined {
		return this.registry.get(taskName);
	}

	getByName(taskName: string): RegisteredTask {
		const task = this.findByName(taskName);

		if (!task) {
			throw new Error(`Task ${c.bold(taskName)} not found`);
		}

		return task;
	}

	onTaskStart(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.Running;
		task.result.startTime = Date.now();
	}

	onTaskFinish(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.Finished;
		task.result.duration = Date.now() - (task.result.startTime ?? 0);
	}

	onTaskFailed(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.Failed;
		task.result.duration = Date.now() - (task.result.startTime ?? 0);
	}

	onTasksScheduled(names: string[]) {
		for (const name of names) {
			this.getByName(name).status = TaskStatus.Scheduled;
		}
	}
}

let id = 0;
export const taskRegistry = new TaskRegistry(id++);
