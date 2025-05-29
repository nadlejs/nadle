import c from "tinyrainbow";
import { distance } from "fastest-levenshtein";

import { TaskStatus, type RegisteredTask } from "./types.js";

export class TaskRegistry {
	private registry = new Map<string, RegisteredTask>();

	register(name: string, task: RegisteredTask) {
		this.registry.set(name, task);
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

	getSimilarTasks(taskName: string): string[] {
		return this.getAll()
			.flatMap(({ name }) => {
				const score = distance(taskName, name);

				if (score > 5) {
					return [];
				}

				return { name, score };
			})
			.sort((a, b) => a.score - b.score)
			.map(({ name }) => name)
			.slice(0, 3);
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

	onTaskQueued(name: string) {
		const task = this.getByName(name);

		task.status = TaskStatus.Queued;
	}
}

export const taskRegistry = new TaskRegistry();
