import { it, expect, describe } from "vitest";

import { drive, policies, ranBefore, createMockDeps } from "./__helpers__.js";

describe.concurrent("TaskScheduler — implicit workspace deps", () => {
	it("runs a workspace's deps before it when implicit deps are enabled", () => {
		const deps = createMockDeps(
			[
				{ name: "build", workspaceId: "packages:lib" },
				{ name: "build", workspaceId: "packages:app" }
			],
			{ parallel: true, implicitDependencies: true, workspaceDeps: { "packages:app": ["packages:lib"] } }
		);

		const { order } = drive(deps);

		expect(ranBefore(order, "packages:lib:build", "packages:app:build")).toBe(true);
	});

	it("treats workspaces as independent when implicit deps are disabled", () => {
		const deps = createMockDeps(
			[
				{ name: "build", workspaceId: "packages:lib" },
				{ name: "build", workspaceId: "packages:app" }
			],
			{ parallel: true, implicitDependencies: false, workspaceDeps: { "packages:app": ["packages:lib"] } }
		);

		const { waves } = drive(deps);

		expect(new Set(waves[0])).toEqual(new Set(["packages:lib:build", "packages:app:build"]));
	});

	it("skips an implicit edge when the dependency workspace lacks the task", () => {
		const deps = createMockDeps([{ name: "build", workspaceId: "packages:app" }], {
			parallel: true,
			implicitDependencies: true,
			workspaceDeps: { "packages:app": ["packages:lib"] }
		});

		const { order } = drive(deps);

		expect(order).toEqual(["packages:app:build"]);
	});
});

describe.concurrent("TaskScheduler — root aggregation", () => {
	it("runs every child workspace task before the aggregating root task", () => {
		const deps = () =>
			createMockDeps([{ name: "build" }, { name: "build", workspaceId: "packages:lib" }, { name: "build", workspaceId: "packages:app" }], {
				parallel: true,
				mainTaskIds: ["build"],
				implicitDependencies: true
			});

		for (const policy of Object.values(policies)) {
			const { order } = drive(deps(), policy);

			expect(ranBefore(order, "packages:lib:build", "build")).toBe(true);
			expect(ranBefore(order, "packages:app:build", "build")).toBe(true);
		}
	});

	it("chains child workspace deps and then the root", () => {
		const deps = createMockDeps([{ name: "build" }, { name: "build", workspaceId: "packages:lib" }, { name: "build", workspaceId: "packages:app" }], {
			parallel: true,
			mainTaskIds: ["build"],
			implicitDependencies: true,
			workspaceDeps: { "packages:app": ["packages:lib"] }
		});

		const { order } = drive(deps);

		expect(ranBefore(order, "packages:lib:build", "packages:app:build")).toBe(true);
		expect(ranBefore(order, "packages:app:build", "build")).toBe(true);
	});

	it("does not aggregate when implicit deps are disabled", () => {
		const deps = createMockDeps([{ name: "build" }, { name: "build", workspaceId: "packages:lib" }, { name: "build", workspaceId: "packages:app" }], {
			parallel: true,
			mainTaskIds: ["build"],
			implicitDependencies: false
		});

		const { waves } = drive(deps);

		expect(new Set(waves[0])).toEqual(new Set(["build", "packages:lib:build", "packages:app:build"]));
	});

	it("drops an excluded child from the root's aggregation deps", () => {
		const deps = createMockDeps([{ name: "build" }, { name: "build", workspaceId: "packages:lib" }, { name: "build", workspaceId: "packages:app" }], {
			parallel: true,
			mainTaskIds: ["build"],
			implicitDependencies: true,
			excludedTasks: ["packages:lib:build"]
		});

		const { order, waves } = drive(deps);

		// the non-excluded child still gates the root
		expect(ranBefore(order, "packages:app:build", "build")).toBe(true);
		// the excluded child no longer gates the root: it is runnable from the first wave
		expect(waves[0]).toContain("packages:lib:build");
	});
});
