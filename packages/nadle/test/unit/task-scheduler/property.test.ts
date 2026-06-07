import { it, expect, describe } from "vitest";

import { randomSubset, createMockDeps, generateRandomDag, driveWithDurations, generateRandomWorkspaceDag } from "./__helpers__.js";

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

// Random graphs with a random subset of tasks excluded. An excluded task is
// never pulled in as a dependency, and every surviving edge (neither endpoint
// excluded) must still be honored.
describe.concurrent("TaskScheduler — randomized exclusion", () => {
	const SEEDS = Array.from({ length: 100 }, (_, i) => i + 1);

	it.each(SEEDS)("seed %i: excluded tasks never run and surviving edges hold", (seed) => {
		const { tasks, edges, durations } = generateRandomDag(seed, 25);
		const allIds = tasks.map((t) => t.name);
		// exclude a subset, but never the seed/main tasks so something still runs
		const excluded = new Set(randomSubset(seed * 31, allIds.slice(5), 0.25));

		// only non-excluded tasks are requested as main tasks
		const mainTaskIds = allIds.filter((id) => !excluded.has(id));
		const deps = createMockDeps(tasks, { mainTaskIds, parallel: true, excludedTasks: [...excluded] });

		const { order, timeline } = driveWithDurations(deps, durations);

		// no excluded task ran
		for (const id of excluded) {
			expect(order).not.toContain(id);
		}

		// every edge whose endpoints both survived is still ordered correctly
		const survivingEdges = edges.filter(
			([dep, dependent]) => !excluded.has(dep) && !excluded.has(dependent) && timeline.has(dep) && timeline.has(dependent)
		);

		for (const [dep, dependent] of survivingEdges) {
			expect(timeline.get(dep)!.end).toBeLessThanOrEqual(timeline.get(dependent)!.start);
		}
	});
});

// Random multi-workspace projects driven by a random acyclic workspace-dependency
// graph, with implicit deps enabled. Every implicit edge derived from the
// workspace graph must be honored on the clock.
describe.concurrent("TaskScheduler — randomized implicit workspace deps", () => {
	const SEEDS = Array.from({ length: 100 }, (_, i) => i + 1);

	it.each(SEEDS)("seed %i: implicit workspace edges are honored", (seed) => {
		const { tasks, durations, workspaceDeps, implicitEdges } = generateRandomWorkspaceDag(seed, 15);
		const deps = createMockDeps(tasks, { workspaceDeps, parallel: true, implicitDependencies: true });

		const { order, timeline } = driveWithDurations(deps, durations);

		expect(order).toHaveLength(tasks.length);

		for (const [dep, dependent] of implicitEdges) {
			expect(timeline.get(dep)!.end).toBeLessThanOrEqual(timeline.get(dependent)!.start);
		}
	});
});
