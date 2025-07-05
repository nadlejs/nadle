import { type TaskIdentifier } from "./task-identifier.js";
import { type Task, type Callback, type Resolver, type TaskConfiguration } from "../types.js";

export enum TaskStatus {
	Registered = "registered",
	Scheduled = "scheduled",
	Running = "running",
	Finished = "finished",
	UpToDate = "up-to-date",
	FromCache = "from-cache",
	Failed = "failed",
	Canceled = "canceled"
}

export interface RegisteredTask extends Task {
	status: TaskStatus;

	readonly label: string;
	readonly id: TaskIdentifier;
	readonly result: TaskResult;
	readonly optionsResolver: Resolver | undefined;
	readonly configResolver: Callback<TaskConfiguration>;
}

interface TaskResult {
	duration: number | null;
	startTime: number | null;
}
