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

export function renderFailureCounts(stats: TaskStats, notRun: number): string {
	const skipped = stats[TaskStatus.Skipped];

	return new StringBuilder(", ")
		.add(`${taskCount(stats[TaskStatus.Finished])} executed`)
		.add(skipped > 0 && `${taskCount(skipped)} skipped`)
		.add(`${taskCount(stats[TaskStatus.Failed])} failed`)
		.add(notRun > 0 && `${c.bold(notRun)} downstream task${notRun > 1 ? "s" : ""} not run`)
		.build();
}
