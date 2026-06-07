import { it, expect, describe } from "vitest";

import { drive, createMockDeps } from "./__helpers__.js";

describe.concurrent("TaskScheduler — parallelism", () => {
	it("offers all independent tasks at once", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b" }, { name: "c" }], { parallel: true });

		const { waves } = drive(deps);

		expect(new Set(waves[0])).toEqual(new Set(["a", "b", "c"]));
	});

	it("offers both branches of a diamond after the root completes", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "c", dependsOn: "a" }, { name: "d", dependsOn: ["b", "c"] }], {
			parallel: true
		});

		const { waves } = drive(deps);

		// first wave: only the root
		expect(waves[0]).toEqual(["a"]);
		// after the root, both branches become runnable together
		expect(new Set(waves[1])).toEqual(new Set(["b", "c"]));
	});

	it("does not offer a dependent until its last dependency is done", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b" }, { name: "sink", dependsOn: ["a", "b"] }], { parallel: true });

		const { waves } = drive(deps);
		const sinkWave = waves.findIndex((wave) => wave.includes("sink"));

		// sink appears only after both a and b were offered in earlier waves
		expect(sinkWave).toBeGreaterThan(0);
		expect(waves[0]).not.toContain("sink");
	});
});
