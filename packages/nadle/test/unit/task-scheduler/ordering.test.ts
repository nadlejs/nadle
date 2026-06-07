import { it, expect, describe } from "vitest";

import { drive, policies, ranBefore, createMockDeps } from "./__helpers__.js";

describe.concurrent("TaskScheduler — ordering", () => {
	it("runs a linear chain in dependency order under any completion timing", () => {
		const deps = () => createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "c", dependsOn: "b" }]);

		for (const policy of Object.values(policies)) {
			const { order } = drive(deps(), policy);

			expect(order).toEqual(["a", "b", "c"]);
		}
	});

	it("respects diamond constraints regardless of which branch finishes first", () => {
		const deps = () =>
			createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "c", dependsOn: "a" }, { name: "d", dependsOn: ["b", "c"] }], {
				parallel: true
			});

		for (const policy of Object.values(policies)) {
			const { order } = drive(deps(), policy);

			expect(order).toHaveLength(4);
			expect(ranBefore(order, "a", "b")).toBe(true);
			expect(ranBefore(order, "a", "c")).toBe(true);
			expect(ranBefore(order, "b", "d")).toBe(true);
			expect(ranBefore(order, "c", "d")).toBe(true);
		}
	});

	it("runs every task exactly once", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "c", dependsOn: "a" }, { name: "d", dependsOn: ["b", "c"] }], {
			parallel: true
		});

		const { order } = drive(deps);

		expect(new Set(order)).toEqual(new Set(["a", "b", "c", "d"]));
		expect(order).toHaveLength(new Set(order).size);
	});

	it("runs a fan-in task only after all its dependencies", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b" }, { name: "c" }, { name: "sink", dependsOn: ["a", "b", "c"] }], { parallel: true });

		const { order } = drive(deps, policies.lifo);

		expect(ranBefore(order, "a", "sink")).toBe(true);
		expect(ranBefore(order, "b", "sink")).toBe(true);
		expect(ranBefore(order, "c", "sink")).toBe(true);
		expect(order.at(-1)).toBe("sink");
	});
});
