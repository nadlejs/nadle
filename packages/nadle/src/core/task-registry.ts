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

	getByName(name: string): RegisteredTask | undefined {
		return this.registry.get(name);
	}

	onTaskStart(name: string) {
		const task = this.getByName(name);

		if (!task) {
			throw new Error(`Task "${name}" not found`);
		}

		task.status = TaskStatus.Running;
		task.result.startTime = Date.now();
	}

	onTaskFinish(name: string) {
		const task = this.getByName(name);

		if (!task) {
			throw new Error(`Task "${name}" not found`);
		}

		task.status = TaskStatus.Finished;
		task.result.duration = Date.now() - (task.result.startTime ?? 0);
	}

	onTaskQueued(name: string) {
		const task = this.getByName(name);

		if (!task) {
			throw new Error(`Task "${name}" not found`);
		}

		task.status = TaskStatus.Queued;
	}
}

export const taskRegistry = new TaskRegistry();
