import { it, expect, describe } from "vitest";

import { createMockDeps, generateRandomDag, driveWithDurations } from "./__helpers__.js";

// Property-style stress test: across many seeds, build a random acyclic graph
// with random (but deterministic) task durations, run it on the simulated
// clock, and assert the scheduler never violates a dependency edge and runs
// every task exactly once — no matter how durations interleave.
describe.concurrent("TaskScheduler — randomized duration stress", () => {
	const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

	it.each(SEEDS)("seed %i: 30-task random DAG honors every edge and runs each task once", (seed) => {
		const { tasks, edges, durations } = generateRandomDag(seed, 30);
		const deps = createMockDeps(tasks, { parallel: true });

		const { order, timeline } = driveWithDurations(deps, durations);

		// every task ran exactly once
		expect(order).toHaveLength(tasks.length);
		expect(new Set(order).size).toBe(tasks.length);

		// every dependency finished no later than its dependent started
		for (const [dep, dependent] of edges) {
			expect(timeline.get(dep)!.end).toBeLessThanOrEqual(timeline.get(dependent)!.start);
		}
	});

	it("is reproducible: same seed yields the same graph and schedule", () => {
		const a = generateRandomDag(12345, 40);
		const b = generateRandomDag(12345, 40);

		expect(a.tasks).toEqual(b.tasks);
		expect(a.durations).toEqual(b.durations);

		const orderA = driveWithDurations(createMockDeps(a.tasks, { parallel: true }), a.durations).order;
		const orderB = driveWithDurations(createMockDeps(b.tasks, { parallel: true }), b.durations).order;

		expect(orderA).toEqual(orderB);
	});

	it("different seeds produce different graphs", () => {
		const a = generateRandomDag(1, 40);
		const b = generateRandomDag(2, 40);

		expect(a.tasks).not.toEqual(b.tasks);
	});

	it("handles large random graphs (200 tasks) without breaking dependency rules", () => {
		const { tasks, edges, durations } = generateRandomDag(999, 200, 5);
		const deps = createMockDeps(tasks, { parallel: true });

		const { order, timeline } = driveWithDurations(deps, durations);

		expect(order).toHaveLength(200);

		for (const [dep, dependent] of edges) {
			expect(timeline.get(dep)!.end).toBeLessThanOrEqual(timeline.get(dependent)!.start);
		}
	});
});
