import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";

import { TaskStatus } from "../../src/core/interfaces/registered-task.js";
import { type TaskStats } from "../../src/core/models/execution-tracker.js";
import { renderFailureCounts, type NonExecutedCounts } from "../../src/core/reporting/run-summary.js";

const stats = (overrides: Partial<TaskStats> = {}): TaskStats => ({
	[TaskStatus.Failed]: 1,
	[TaskStatus.Running]: 0,
	[TaskStatus.Skipped]: 0,
	[TaskStatus.Canceled]: 0,
	[TaskStatus.Finished]: 1,
	[TaskStatus.UpToDate]: 0,
	[TaskStatus.FromCache]: 0,
	[TaskStatus.Scheduled]: 0,
	...overrides
});

const render = (taskStats: TaskStats, nonExecuted: NonExecutedCounts) => stripAnsi(renderFailureCounts(taskStats, nonExecuted));

describe("renderFailureCounts", () => {
	it("omits both non-executed counts when they are zero", () => {
		expect(render(stats(), { blocked: 0, notStarted: 0 })).toBe("1 task executed, 1 task failed");
	});

	it("reports blocked and not started as distinct counts", () => {
		expect(render(stats(), { blocked: 2, notStarted: 3 })).toBe("1 task executed, 1 task failed, 2 tasks blocked, 3 tasks not started");
	});

	it("reports a not started count without a blocked count", () => {
		expect(render(stats(), { blocked: 0, notStarted: 1 })).toBe("1 task executed, 1 task failed, 1 task not started");
	});

	it("keeps canceled, blocked and not started in spec order", () => {
		const output = render(stats({ [TaskStatus.Skipped]: 1, [TaskStatus.Canceled]: 1 }), { blocked: 1, notStarted: 1 });

		expect(output).toBe("1 task executed, 1 task skipped, 1 task failed, 1 task canceled, 1 task blocked, 1 task not started");
	});
});
