import c from "tinyrainbow";

import { TaskStatus } from "../interfaces/registered-task.js";
import { StringBuilder } from "../utilities/string-builder.js";
import { type TaskStats } from "../models/execution-tracker.js";

const taskCount = (count: number) => `${c.bold(count)} task${count > 1 ? "s" : ""}`;

export function renderSuccessCounts(stats: TaskStats): string {
	return new StringBuilder(", ")
		.add(`${taskCount(stats[TaskStatus.Finished])} executed`)
		.add(stats[TaskStatus.UpToDate] > 0 && `${taskCount(stats[TaskStatus.UpToDate])} up-to-date`)
		.add(stats[TaskStatus.FromCache] > 0 && `${taskCount(stats[TaskStatus.FromCache])} restored from cache`)
		.add(stats[TaskStatus.Skipped] > 0 && `${taskCount(stats[TaskStatus.Skipped])} skipped`)
		.build();
}

export interface NonExecutedCounts {
	readonly blocked: number;
	readonly notStarted: number;
}

export function renderFailureCounts(stats: TaskStats, nonExecuted: NonExecutedCounts): string {
	const skipped = stats[TaskStatus.Skipped];
	const canceled = stats[TaskStatus.Canceled];
	const { blocked, notStarted } = nonExecuted;

	return new StringBuilder(", ")
		.add(`${taskCount(stats[TaskStatus.Finished])} executed`)
		.add(skipped > 0 && `${taskCount(skipped)} skipped`)
		.add(`${taskCount(stats[TaskStatus.Failed])} failed`)
		.add(canceled > 0 && `${taskCount(canceled)} canceled`)
		.add(blocked > 0 && `${taskCount(blocked)} blocked`)
		.add(notStarted > 0 && `${taskCount(notStarted)} not started`)
		.build();
}
