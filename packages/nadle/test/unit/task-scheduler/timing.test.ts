import { it, expect, describe } from "vitest";

import { ranBefore, createMockDeps, driveWithDurations } from "./__helpers__.js";

// These tests model real task runtime on a simulated clock: a long-running task
// offered early can finish after short tasks offered later. The scheduler must
// still honor dependency ordering and run every task exactly once regardless of
// how durations interleave.
describe.concurrent("TaskScheduler — duration-driven scheduling", () => {
	it("lets a short independent task finish before a long one started at the same time", () => {
		const deps = createMockDeps([{ name: "long" }, { name: "short" }], { parallel: true });

		const { order } = driveWithDurations(deps, { short: 1, long: 100 });

		expect(order).toEqual(["short", "long"]);
	});

	it("unblocks a dependent as soon as its dependency finishes, while a sibling still runs", () => {
		// a (1) and slow (100) start together; a finishes first and unblocks b (1),
		// so b runs and finishes long before slow.
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "slow" }], { parallel: true });

		const { order, timeline } = driveWithDurations(deps, { a: 1, b: 1, slow: 100 });

		expect(ranBefore(order, "b", "slow")).toBe(true);
		// b started right when a finished, not after slow
		expect(timeline.get("b")!.start).toBe(timeline.get("a")!.end);
	});

	it("respects diamond constraints even when one branch is far slower", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "c", dependsOn: "a" }, { name: "d", dependsOn: ["b", "c"] }], {
			parallel: true
		});

		// c is slow; d must still wait for the slower of b/c
		const { order, timeline } = driveWithDurations(deps, { a: 1, b: 1, d: 1, c: 50 });

		expect(ranBefore(order, "b", "d")).toBe(true);
		expect(ranBefore(order, "c", "d")).toBe(true);
		// d cannot start before the slower dependency (c) finished
		expect(timeline.get("d")!.start).toBeGreaterThanOrEqual(timeline.get("c")!.end);
	});

	it("runs independent branches concurrently (peak concurrency > 1)", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b" }, { name: "c" }], { parallel: true });

		const { peakConcurrency } = driveWithDurations(deps, { a: 5, b: 5, c: 5 });

		expect(peakConcurrency).toBe(3);
	});

	it("runs a deep diamond with varied durations exactly once, honoring every edge", () => {
		const deps = createMockDeps(
			[
				{ name: "s" },
				{ name: "a", dependsOn: "s" },
				{ name: "b", dependsOn: "s" },
				{ name: "c", dependsOn: ["a", "b"] },
				{ name: "d", dependsOn: "a" },
				{ name: "sink", dependsOn: ["c", "d"] }
			],
			{ parallel: true }
		);

		const { order, timeline } = driveWithDurations(deps, { s: 3, a: 1, c: 2, d: 7, b: 10, sink: 1 });

		expect(new Set(order)).toEqual(new Set(["s", "a", "b", "c", "d", "sink"]));

		// every edge: dependency ends no later than dependent starts
		const edges: Array<[string, string]> = [
			["s", "a"],
			["s", "b"],
			["a", "c"],
			["b", "c"],
			["a", "d"],
			["c", "sink"],
			["d", "sink"]
		];

		for (const [dep, dependent] of edges) {
			expect(timeline.get(dep)!.end).toBeLessThanOrEqual(timeline.get(dependent)!.start);
		}
	});

	it("keeps dependency ordering when durations would otherwise reverse it", () => {
		// chain a -> b -> c, but give earlier tasks longer durations; clock order
		// must still be a, b, c because of the dependency edges.
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "c", dependsOn: "b" }]);

		const { order } = driveWithDurations(deps, { c: 1, b: 50, a: 100 });

		expect(order).toEqual(["a", "b", "c"]);
	});
});
