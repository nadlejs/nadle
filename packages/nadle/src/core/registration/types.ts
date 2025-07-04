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
	name: string;
	status: TaskStatus;
	optionsResolver: Resolver | undefined;
	configResolver: Callback<TaskConfiguration>;
	result: {
		duration: number | null;
		startTime: number | null;
	};
}
