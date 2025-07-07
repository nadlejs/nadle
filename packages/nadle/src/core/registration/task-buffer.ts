import type { RegisteredTask } from "./types.js";
import { type TaskIdentifier } from "./task-identifier.js";

interface BufferedTask extends Omit<RegisteredTask, "label"> {}

export class TaskBuffer {
	private readonly bufferTasks = new Map<TaskIdentifier, BufferedTask>();

	public set(bufferedTask: BufferedTask): void {
		this.bufferTasks.set(bufferedTask.id, bufferedTask);
	}

	public has(id: TaskIdentifier): boolean {
		return this.bufferTasks.has(id);
	}

	public flush(): BufferedTask[] {
		const result = Array.from(this.bufferTasks.values());
		this.bufferTasks.clear();

		return result;
	}
}
