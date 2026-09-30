import { it, expect, describe } from "vitest";

import { createMockDeps } from "./__helpers__.js";
import { TaskScheduler } from "../../../src/core/engine/task-scheduler.js";

// A failed task must not read as still running. The pool calls markFailed the moment a
// task throws, which is BEFORE it feeds the id back through getReadyTasks to settle
// it — so there is a window where the id is in readyTasks and not yet in
// settledTaskIds. Without the failedTaskIds check, the tree never reads as exhausted
// in that window, the sequential walk never advances, and --continue can never reach
// the next main task.
//
// Called directly rather than driven. The regression's failure mode is a non-
// terminating walk inside getReadyTasks: it exhausts the heap, kills the vitest
// worker, and vitest then reports the whole FILE as 0-run/pending with a SUCCESSFUL
// exit — so a driving test cannot redden CI for it. canProgressInCurrentTree is a
// single bounded pass over the indegree map and cannot spin.
describe("TaskScheduler — a failed task is not in flight", () => {
	const canProgress = (scheduler: TaskScheduler) => Reflect.get(scheduler, "canProgressInCurrentTree").bind(scheduler) as () => boolean;

	it("reports no progress once the only in-flight task has failed", () => {
		const deps = createMockDeps([{ name: "failing" }, { name: "gate", dependsOn: ["failing"] }], { parallel: false, mainTaskIds: ["gate"] });
		const scheduler = new TaskScheduler(deps).init();

		// `failing` is offered and is the only thing in flight, so the tree can progress.
		expect([...scheduler.getReadyTasks()]).toEqual(["failing"]);
		expect(canProgress(scheduler)()).toBe(true);

		// markFailed alone, exactly as the pool does it before settling the id.
		scheduler.markFailed("failing");

		// `failing` is still in readyTasks and still unsettled, but it is finished.
		// `gate` is inadmissible — its closure holds the failure — so nothing is left.
		expect(canProgress(scheduler)()).toBe(false);
	});

	it("still reports progress while a healthy sibling is in flight", () => {
		const deps = createMockDeps([{ name: "failing" }, { name: "sibling" }, { name: "gate", dependsOn: ["failing", "sibling"] }], {
			parallel: false,
			mainTaskIds: ["gate"]
		});
		const scheduler = new TaskScheduler(deps).init();

		expect([...scheduler.getReadyTasks()].sort()).toEqual(["failing", "sibling"]);
		scheduler.markFailed("failing");

		// The failure must not collapse the tree while `sibling` is genuinely running.
		expect(canProgress(scheduler)()).toBe(true);
	});
});
