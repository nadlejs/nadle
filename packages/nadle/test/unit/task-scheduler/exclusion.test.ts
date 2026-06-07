import { it, expect, describe } from "vitest";

import { drive, createMockDeps } from "./__helpers__.js";

// Exclusion removes a task from other tasks' *dependency* sets — a dependent no
// longer waits for (or pulls in) an excluded task. A task that is itself a
// requested main task is still run; exclusion only severs dependency edges.
describe.concurrent("TaskScheduler — exclusion", () => {
	it("does not pull in an excluded task that is only reachable as a dependency", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }], {
			mainTasks: ["b"],
			excludedTasks: ["a"]
		});

		const { order } = drive(deps);

		expect(order).toEqual(["b"]);
	});

	it("unblocks a dependent immediately once its only dependency is excluded", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }], {
			mainTasks: ["b"],
			excludedTasks: ["a"]
		});

		const { waves } = drive(deps);

		expect(waves[0]).toEqual(["b"]);
	});

	it("drops an implicit dependency when its target task is excluded", () => {
		const deps = createMockDeps(
			[
				{ name: "build", workspaceId: "packages:lib" },
				{ name: "build", workspaceId: "packages:app" }
			],
			{
				parallel: true,
				implicitDependencies: true,
				mainTaskIds: ["packages:app:build"],
				excludedTasks: ["packages:lib:build"],
				workspaceDeps: { "packages:app": ["packages:lib"] }
			}
		);

		const { order, waves } = drive(deps);

		expect(order).toEqual(["packages:app:build"]);
		expect(waves[0]).toContain("packages:app:build");
	});
});
