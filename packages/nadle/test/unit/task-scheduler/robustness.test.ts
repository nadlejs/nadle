import { it, expect, describe } from "vitest";

import { drive, policies, createMockDeps } from "./__helpers__.js";

describe.concurrent("TaskScheduler — robustness", () => {
	it("handles a single task with no dependencies", () => {
		const deps = createMockDeps([{ name: "solo" }]);

		const { order, waves } = drive(deps);

		expect(order).toEqual(["solo"]);
		expect(waves).toEqual([["solo"]]);
	});

	it("produces the same completion order no matter the completion timing", () => {
		const build = () =>
			createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "c", dependsOn: "a" }, { name: "d", dependsOn: ["b", "c"] }], {
				parallel: true
			});

		const orders = Object.values(policies).map((policy) => drive(build(), policy).order);

		// every policy must drain the full graph respecting the same constraints
		for (const order of orders) {
			expect(new Set(order)).toEqual(new Set(["a", "b", "c", "d"]));
			expect(order[0]).toBe("a");
			expect(order.at(-1)).toBe("d");
		}
	});

	it("schedules 500 tasks across 100 workspaces quickly", () => {
		const workspaceCount = 100;
		const tasksPerWorkspace = 5;
		const taskNames = ["build", "test", "lint", "check", "deploy"];
		const tasks = [];
		const workspaceDeps: Record<string, string[]> = {};

		for (let wsIdx = 0; wsIdx < workspaceCount; wsIdx++) {
			const wsId = `packages:ws-${wsIdx}`;

			if (wsIdx > 0) {
				workspaceDeps[wsId] = [`packages:ws-${wsIdx - 1}`];
			}

			for (let taskIdx = 0; taskIdx < tasksPerWorkspace; taskIdx++) {
				tasks.push({ workspaceId: wsId, name: taskNames[taskIdx] });
			}
		}

		const deps = createMockDeps(tasks, { workspaceDeps, parallel: true, implicitDependencies: true });

		const start = performance.now();
		const { order } = drive(deps);
		const elapsed = performance.now() - start;

		expect(elapsed).toBeLessThan(200);
		expect(order).toHaveLength(workspaceCount * tasksPerWorkspace);
	});
});
