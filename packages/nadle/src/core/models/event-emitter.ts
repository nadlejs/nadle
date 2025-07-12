import { type Awaitable } from "../utilities/types.js";
import { type Listener } from "../interfaces/listener.js";
import { type RegisteredTask } from "../interfaces/registered-task.js";

export class EventEmitter implements Required<Listener> {
	public constructor(private readonly listeners: Listener[]) {}

	private async emit<K extends keyof Listener>(event: K, ...args: Parameters<NonNullable<Listener[K]>>): Promise<void> {
		for (const listener of this.listeners) {
			await (listener[event] as ((...args: unknown[]) => Awaitable<void>) | undefined)?.(...args);
		}
	}

	public async init(): Promise<this> {
		await this.emit("init");

		return this;
	}

	public async onExecutionFailed(error: unknown): Promise<void> {
		await this.emit("onExecutionFailed", error);
	}

	public async onExecutionFinish(): Promise<void> {
		await this.emit("onExecutionFinish");
	}

	public async onExecutionStart(): Promise<void> {
		await this.emit("onExecutionStart");
	}

	public async onTaskCanceled(task: RegisteredTask): Promise<void> {
		await this.emit("onTaskCanceled", task);
	}

	public async onTaskFailed(task: RegisteredTask): Promise<void> {
		await this.emit("onTaskFailed", task);
	}

	public async onTaskFinish(task: RegisteredTask): Promise<void> {
		await this.emit("onTaskFinish", task);
	}

	public async onTaskRestoreFromCache(task: RegisteredTask): Promise<void> {
		await this.emit("onTaskRestoreFromCache", task);
	}

	public async onTaskStart(task: RegisteredTask, threadId: number): Promise<void> {
		await this.emit("onTaskStart", task, threadId);
	}

	public async onTaskUpToDate(task: RegisteredTask): Promise<void> {
		await this.emit("onTaskUpToDate", task);
	}

	public async onTasksScheduled(tasks: RegisteredTask[]): Promise<void> {
		await this.emit("onTasksScheduled", tasks);
	}
}
