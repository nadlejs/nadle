import { it, expect, describe } from "vitest";

import { createMockDeps } from "./__helpers__.js";
import { TaskScheduler } from "../../../src/core/engine/task-scheduler.js";

// A repeated task id on the command line (`nadle build build`) reaches the scheduler
// verbatim — nothing dedupes it. The sequential main-task walk must therefore advance
// by position, not by looking the current id up by value: `indexOf` returns the FIRST
// occurrence, so a value-based advance parks on a duplicate and never terminates.
//
// These drive the scheduler end to end, which is what a user actually hits. Note the
// limit: the regression's failure mode is an allocating spin INSIDE `getReadyTasks`,
// so `drainWithin`'s cap is never reached — the worker dies first and vitest reports
// this whole file as 0-run/pending with a successful exit. These therefore corroborate
// the behavior but cannot redden CI on their own. The loud, spin-proof guarantee lives
// in `main-task-cursor.test.ts`; keep both.
function drainWithin(scheduler: TaskScheduler, limit: number) {
	const order: string[] = [];
	let batch = scheduler.getReadyTasks();

	while (batch.size > 0) {
		if (order.length >= limit) {
			return { order, drained: false };
		}

		const [taskId] = batch;
		order.push(taskId);
		batch = scheduler.getReadyTasks(taskId);
	}

	return { order, drained: true };
}

describe.concurrent("TaskScheduler — repeated main task ids", () => {
	it("terminates when a main task id is repeated", () => {
		const deps = createMockDeps([{ name: "x" }, { name: "a" }], { parallel: false, mainTaskIds: ["x", "a", "a"] });

		const { order, drained } = drainWithin(new TaskScheduler(deps).init(), 20);

		expect(drained).toBe(true);
		expect(order).toEqual(["x", "a"]);
	});

	it("terminates when the repeated id is the only main task", () => {
		const deps = createMockDeps([{ name: "a" }], { parallel: false, mainTaskIds: ["a", "a"] });

		const { order, drained } = drainWithin(new TaskScheduler(deps).init(), 20);

		expect(drained).toBe(true);
		expect(order).toEqual(["a"]);
	});

	it("terminates when a repeated main task drags in a dependency tree", () => {
		const deps = createMockDeps([{ name: "dep" }, { name: "a", dependsOn: "dep" }], { parallel: false, mainTaskIds: ["a", "a"] });

		const { order, drained } = drainWithin(new TaskScheduler(deps).init(), 20);

		expect(drained).toBe(true);
		expect(order).toEqual(["dep", "a"]);
	});

	it("still drains distinct main tasks sharing a dependency in order", () => {
		const deps = createMockDeps([{ name: "shared" }, { name: "a", dependsOn: "shared" }, { name: "b", dependsOn: "shared" }], {
			parallel: false,
			mainTaskIds: ["a", "b"]
		});

		const { order, drained } = drainWithin(new TaskScheduler(deps).init(), 20);

		expect(drained).toBe(true);
		expect(order).toEqual(["shared", "a", "b"]);
	});
});
