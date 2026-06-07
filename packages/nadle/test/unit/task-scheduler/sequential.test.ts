import { it, expect, describe } from "vitest";

import { drive, policies, ranBefore, createMockDeps } from "./__helpers__.js";

// In sequential mode (parallel: false) the scheduler runs one main task tree at
// a time: a main task's full dependency subtree drains before the next main
// task is offered.
describe.concurrent("TaskScheduler — sequential mode", () => {
	it("runs only the current main task's dependency tree", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "x" }, { name: "y", dependsOn: "x" }], {
			parallel: false,
			mainTaskIds: ["b"]
		});

		const { order } = drive(deps);

		expect(new Set(order)).toEqual(new Set(["a", "b"]));
		expect(order).not.toContain("x");
		expect(order).not.toContain("y");
	});

	it("drains each main task tree fully before starting the next", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "x" }, { name: "y", dependsOn: "x" }], {
			parallel: false,
			mainTaskIds: ["b", "y"]
		});

		const { order } = drive(deps);

		expect(order).toEqual(["a", "b", "x", "y"]);
	});

	it("keeps main task order stable across completion timings", () => {
		const build = () =>
			createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "x" }, { name: "y", dependsOn: "x" }], {
				parallel: false,
				mainTaskIds: ["b", "y"]
			});

		for (const policy of Object.values(policies)) {
			const { order } = drive(build(), policy);

			expect(ranBefore(order, "b", "y")).toBe(true);
			expect(ranBefore(order, "a", "b")).toBe(true);
			expect(ranBefore(order, "x", "y")).toBe(true);
		}
	});
});
