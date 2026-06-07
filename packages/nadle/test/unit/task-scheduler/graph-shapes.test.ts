import { it, expect, describe } from "vitest";

import { drive, policies, ranBefore, type TaskDef, createMockDeps } from "./__helpers__.js";

/** Asserts every dependency completes before each of its dependents. */
function expectTopologicallyValid(order: string[], edges: Array<[string, string]>) {
	for (const [dep, dependent] of edges) {
		expect(ranBefore(order, dep, dependent)).toBe(true);
	}
}

describe.concurrent("TaskScheduler — complex graph shapes", () => {
	it("drains a deep linear chain of 50 tasks in exact order", () => {
		const tasks: TaskDef[] = [{ name: "t0" }];

		for (let i = 1; i < 50; i++) {
			tasks.push({ name: `t${i}`, dependsOn: `t${i - 1}` });
		}

		const { order } = drive(createMockDeps(tasks, { parallel: true }));

		expect(order).toEqual(Array.from({ length: 50 }, (_, i) => `t${i}`));
	});

	it("runs a wide fan-out then a single fan-in (1 → 20 → 1)", () => {
		const leaves = Array.from({ length: 20 }, (_, i) => `leaf${i}`);
		const tasks: TaskDef[] = [{ name: "root" }, ...leaves.map((name) => ({ name, dependsOn: "root" })), { name: "sink", dependsOn: leaves }];

		const { order, waves } = drive(createMockDeps(tasks, { parallel: true }));

		expect(order).toHaveLength(22);
		expect(order[0]).toBe("root");
		expect(order.at(-1)).toBe("sink");
		// after root, all 20 leaves become runnable together
		expect(new Set(waves[1])).toEqual(new Set(leaves));
	});

	it("runs a shared dependency exactly once for many dependents", () => {
		const dependents = Array.from({ length: 10 }, (_, i) => ({ name: `d${i}`, dependsOn: "shared" }));
		const tasks: TaskDef[] = [{ name: "shared" }, ...dependents];

		const { order } = drive(createMockDeps(tasks, { parallel: true }));

		expect(order.filter((t) => t === "shared")).toEqual(["shared"]);

		for (let i = 0; i < 10; i++) {
			expect(ranBefore(order, "shared", `d${i}`)).toBe(true);
		}
	});

	it("drains multiple disconnected components", () => {
		const tasks: TaskDef[] = [{ name: "a1" }, { name: "a2", dependsOn: "a1" }, { name: "b1" }, { name: "b2", dependsOn: "b1" }, { name: "c1" }];

		const { order } = drive(createMockDeps(tasks, { parallel: true }));

		expect(new Set(order)).toEqual(new Set(["a1", "a2", "b1", "b2", "c1"]));
		expect(ranBefore(order, "a1", "a2")).toBe(true);
		expect(ranBefore(order, "b1", "b2")).toBe(true);
	});

	it("deduplicates repeated dependsOn entries", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: ["a", "a", "a"] }], { parallel: true });

		const { order } = drive(deps);

		expect(order).toEqual(["a", "b"]);
	});

	it("handles a layered DAG with cross edges under every completion timing", () => {
		// Layer 0: s. Layer 1: a,b,c (all need s). Layer 2: d (a,b), e (b,c).
		// Layer 3: f (d,e). Plus a cross edge e -> a's sibling is avoided; keep acyclic.
		const tasks: TaskDef[] = [
			{ name: "s" },
			{ name: "a", dependsOn: "s" },
			{ name: "b", dependsOn: "s" },
			{ name: "c", dependsOn: "s" },
			{ name: "d", dependsOn: ["a", "b"] },
			{ name: "e", dependsOn: ["b", "c"] },
			{ name: "f", dependsOn: ["d", "e"] }
		];
		const edges: Array<[string, string]> = [
			["s", "a"],
			["s", "b"],
			["s", "c"],
			["a", "d"],
			["b", "d"],
			["b", "e"],
			["c", "e"],
			["d", "f"],
			["e", "f"]
		];

		for (const policy of Object.values(policies)) {
			const { order } = drive(createMockDeps(tasks, { parallel: true }), policy);

			expect(order).toHaveLength(7);
			expect(new Set(order).size).toBe(7);
			expectTopologicallyValid(order, edges);
			expect(order[0]).toBe("s");
			expect(order.at(-1)).toBe("f");
		}
	});

	it("validates a generated multi-layer DAG (10 layers, 5 per layer)", () => {
		const layers = 10;
		const perLayer = 5;
		const tasks: TaskDef[] = [];
		const edges: Array<[string, string]> = [];

		for (let l = 0; l < layers; l++) {
			for (let n = 0; n < perLayer; n++) {
				const name = `l${l}n${n}`;

				if (l === 0) {
					tasks.push({ name });
					continue;
				}

				// each node depends on two deterministic nodes from the previous layer
				const dep1 = `l${l - 1}n${n % perLayer}`;
				const dep2 = `l${l - 1}n${(n + 1) % perLayer}`;
				const dependsOn = dep1 === dep2 ? [dep1] : [dep1, dep2];

				tasks.push({ name, dependsOn });

				for (const d of dependsOn) {
					edges.push([d, name]);
				}
			}
		}

		const { order } = drive(createMockDeps(tasks, { parallel: true }), policies.reverseAlpha);

		expect(order).toHaveLength(layers * perLayer);
		expect(new Set(order).size).toBe(layers * perLayer);
		expectTopologicallyValid(order, edges);
	});
});
