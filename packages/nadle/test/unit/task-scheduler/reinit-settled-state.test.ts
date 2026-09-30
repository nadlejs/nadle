import { it, expect, describe } from "vitest";

import { createMockDeps } from "./__helpers__.js";
import { TaskScheduler } from "../../../src/core/engine/task-scheduler.js";

// init() must clear the settled set. The watch loop and the --since pre-pass both
// re-init the SAME scheduler instance, so a settled id carried over from a previous
// run makes a task that is genuinely in flight read as already done. The
// tree-exhaustion check then sees no progress possible, advances the sequential main
// task off a LIVE tree, and everything above the in-flight task is silently dropped.
//
// Two main tasks, not one: with a single main task the premature advance exhausts the
// cursor, `mainTaskId` goes undefined, and the whole graph becomes admissible again —
// which masks the leak entirely. The later tree is what turns it into a lost task.
//
// These drive the scheduler, but only forward and only over four tasks, so every path
// is bounded by construction; there is no spin hiding behind a timeout here.
describe("TaskScheduler — init clears settled state", () => {
	const makeDeps = () =>
		createMockDeps([{ name: "a" }, { name: "b" }, { name: "root", dependsOn: ["a", "b"] }, { name: "other" }], {
			parallel: false,
			mainTaskIds: ["root", "other"]
		});

	it("keeps an in-flight task alive across a re-init instead of dropping its tree", () => {
		const scheduler = new TaskScheduler(makeDeps());

		// First run: offer both leaves and settle one, then re-init the way the watch
		// loop does on a file change. `a` is the id that leaks if reset() forgets it.
		scheduler.init();
		scheduler.getReadyTasks();
		scheduler.getReadyTasks("a");

		scheduler.init();

		expect([...scheduler.getReadyTasks()].sort()).toEqual(["a", "b"]);

		// `b` settles while `a` is still in flight. The root tree is not exhausted, so
		// the walk must NOT advance to `other` here.
		expect([...scheduler.getReadyTasks("b")]).toEqual([]);

		// `a` completing is what unblocks root. With a leaked settled set the walk has
		// already moved to `other`, root is no longer in the current tree, and this is
		// empty — the task is lost with no failure and no diagnostic.
		expect([...scheduler.getReadyTasks("a")]).toEqual(["root"]);
	});
});
