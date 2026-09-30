import { it, expect, describe } from "vitest";

import { createMockDeps } from "./task-scheduler/__helpers__.js";
import { TaskScheduler } from "../../src/core/engine/task-scheduler.js";
import { hasFailureInClosure, type NonExecutedTasks, classifyNonExecutedTasks } from "../../src/core/engine/failure-classifier.js";

/**
 * Diamond plus an unrelated task: a <- b, a <- c, {b,c} <- d, and solo standing alone.
 * Built through the real scheduler so the closure under test is the production one.
 */
const diamond = [{ name: "a" }, { name: "solo" }, { name: "b", dependsOn: "a" }, { name: "c", dependsOn: "a" }, { name: "d", dependsOn: ["b", "c"] }];

function closureOf(tasks = diamond) {
	const scheduler = new TaskScheduler(createMockDeps(tasks)).init();

	return (taskId: string) => scheduler.getTransitiveDependencies(taskId);
}

function classify(failed: string[], nonExecuted: string[], tasks = diamond): NonExecutedTasks {
	return classifyNonExecutedTasks({
		failedTaskIds: new Set(failed),
		nonExecutedTaskIds: nonExecuted,
		getTransitiveDependencies: closureOf(tasks)
	});
}

describe.concurrent("classifyNonExecutedTasks", () => {
	it("classifies a direct dependent of a failure as blocked", () => {
		expect(classify(["a"], ["b"])).toEqual({ blocked: ["b"], notStarted: [] });
	});

	it("classifies a task blocked only via a blocked intermediate as blocked", () => {
		// d depends on b and c, neither of which failed — a did. Only a transitive
		// closure puts a in d's closure, so a direct-dependency check misclassifies d.
		const directDependenciesOnly = (taskId: string) => new TaskScheduler(createMockDeps(diamond)).init().getDirectDependencies(taskId);

		expect(classify(["a"], ["d"])).toEqual({ blocked: ["d"], notStarted: [] });
		expect(hasFailureInClosure("d", new Set(["a"]), directDependenciesOnly)).toBe(false);
	});

	it("classifies a diamond join as blocked exactly once", () => {
		// Both b and c carry the failed a; d must appear once, not once per path.
		expect(classify(["a"], ["b", "c", "d"])).toEqual({ notStarted: [], blocked: ["b", "c", "d"] });
	});

	it("classifies a task blocked via two different failed ancestors as blocked once", () => {
		expect(classify(["b", "c"], ["d"])).toEqual({ blocked: ["d"], notStarted: [] });
	});

	it("classifies an independent task as not started", () => {
		expect(classify(["a"], ["solo"])).toEqual({ blocked: [], notStarted: ["solo"] });
	});

	it("classifies the sibling branch as not started and the join as blocked", () => {
		expect(classify(["b"], ["c", "d"])).toEqual({ blocked: ["d"], notStarted: ["c"] });
	});

	it("classifies everything as not started when nothing failed", () => {
		expect(classify([], ["b", "c", "d", "solo"])).toEqual({ blocked: [], notStarted: ["b", "c", "d", "solo"] });
	});

	it("returns empty sets when no task was left unexecuted", () => {
		expect(classify(["a"], [])).toEqual({ blocked: [], notStarted: [] });
	});

	it("partitions every non-executed task into exactly one state", () => {
		const nonExecuted = ["b", "c", "d", "solo"];
		const { blocked, notStarted } = classify(["a"], nonExecuted);

		expect([...blocked, ...notStarted].sort()).toEqual([...nonExecuted].sort());
		expect(blocked.filter((id) => notStarted.includes(id))).toEqual([]);
	});

	it("does not treat a task as blocked by its own failure", () => {
		// A failed task reached a terminal status, so it is never in the non-executed
		// set; a self-failure must not leak into an unrelated task's classification.
		expect(classify(["solo"], ["b"])).toEqual({ blocked: [], notStarted: ["b"] });
	});
});
