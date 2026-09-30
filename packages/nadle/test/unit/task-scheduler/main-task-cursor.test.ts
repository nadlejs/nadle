import { it, expect, describe } from "vitest";

import { createMockDeps } from "./__helpers__.js";
import { TaskScheduler } from "../../../src/core/engine/task-scheduler.js";

// The sequential main-task walk must advance by POSITION. A repeated task id reaches
// the scheduler verbatim (`nadle build build` — nothing dedupes it), and advancing by
// looking the current id up lands on `indexOf`'s FIRST occurrence, so the cursor never
// moves and the walk in getInitialReadyTasksAcrossMainTasks never terminates.
//
// This lives in its own file, and never drives the scheduler, on purpose. The
// regression's failure mode is an allocating spin inside getReadyTasks that kills the
// worker, and vitest then reports the whole FILE as 0-run/pending with a SUCCESSFUL
// exit — so any assertion sharing a file with a driving test is silently lost. These
// call moveToNextMainTask directly, a bounded operation that cannot spin, so a
// regression here fails loudly and reddens CI.
describe.concurrent("TaskScheduler — main task cursor", () => {
	const advanceOf = (scheduler: TaskScheduler) => Reflect.get(scheduler, "moveToNextMainTask").bind(scheduler) as () => string | undefined;

	it("advances past a duplicate instead of parking on it", () => {
		const deps = createMockDeps([{ name: "x" }, { name: "a" }], { parallel: false, mainTaskIds: ["x", "a", "a"] });
		const advance = advanceOf(new TaskScheduler(deps).init());

		// Positions are x, a, a. From x: a, then the SECOND a, then exhausted — and
		// exhausted is sticky, so the walk cannot revive itself.
		expect([advance(), advance(), advance(), advance()]).toEqual(["a", "a", undefined, undefined]);
	});

	it("terminates when every main task is the same id", () => {
		const deps = createMockDeps([{ name: "a" }], { parallel: false, mainTaskIds: ["a", "a", "a"] });
		const advance = advanceOf(new TaskScheduler(deps).init());

		// Three positions, all holding "a": the cursor visits the second and third and
		// then exhausts. The value-based advance would return "a" forever.
		expect([advance(), advance(), advance()]).toEqual(["a", "a", undefined]);
	});

	it("visits distinct main tasks in order and then stops", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b" }, { name: "c" }], { parallel: false, mainTaskIds: ["a", "b", "c"] });
		const advance = advanceOf(new TaskScheduler(deps).init());

		expect([advance(), advance(), advance()]).toEqual(["b", "c", undefined]);
	});

	it("never advances in parallel mode, where there is no main task", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "a" }], { parallel: true, mainTaskIds: ["a", "a"] });
		const advance = advanceOf(new TaskScheduler(deps).init());

		expect([advance(), advance()]).toEqual([undefined, undefined]);
	});
});
