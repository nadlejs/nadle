import { it, expect, describe } from "vitest";

import { createMockDeps, generateRandomDag, driveWithDurations, generateRandomWorkspaceDag } from "./__helpers__.js";

// Because every seed produces a fully deterministic graph, durations, and
// schedule, we can lock the exact resulting execution order with a snapshot.
// Any unintended change to scheduling logic shows up as a snapshot diff.
describe("TaskScheduler — deterministic schedule snapshots", () => {
	const SEEDS = [1, 42, 777, 31337];

	it.each(SEEDS)("seed %i: 15-task random DAG schedule is stable", (seed) => {
		const { tasks, durations } = generateRandomDag(seed, 15);

		const { order } = driveWithDurations(createMockDeps(tasks, { parallel: true }), durations);

		expect(order).toMatchSnapshot();
	});

	it.each(SEEDS)("seed %i: random workspace project schedule is stable", (seed) => {
		const { tasks, durations, workspaceDeps } = generateRandomWorkspaceDag(seed, 8);

		const { order } = driveWithDurations(createMockDeps(tasks, { workspaceDeps, parallel: true, implicitDependencies: true }), durations);

		expect(order).toMatchSnapshot();
	});
});
