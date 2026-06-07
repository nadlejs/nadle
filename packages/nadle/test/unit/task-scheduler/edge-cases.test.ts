import { it, expect, describe } from "vitest";

import { drive, createMockDeps } from "./__helpers__.js";
import { TaskScheduler } from "../../../src/core/engine/task-scheduler.js";

describe.concurrent("TaskScheduler — edge cases", () => {
	it("runs a single task with no dependencies", () => {
		const { order, waves } = drive(createMockDeps([{ name: "solo" }]));

		expect(order).toEqual(["solo"]);
		expect(waves).toEqual([["solo"]]);
	});

	it("treats an explicit empty dependsOn array as no dependency", () => {
		const deps = createMockDeps([{ name: "a", dependsOn: [] }]);

		const { order } = drive(deps);

		expect(order).toEqual(["a"]);
	});

	it("rejects a self-cycle A → A", () => {
		const deps = createMockDeps([{ name: "a", dependsOn: "a" }]);

		expect(() => new TaskScheduler(deps).init()).toThrow(/Cycle/);
	});

	it("expands a root task to all same-named child workspace tasks", () => {
		const deps = createMockDeps([{ name: "build" }, { name: "build", workspaceId: "packages:a" }, { name: "build", workspaceId: "packages:b" }], {
			parallel: true,
			mainTaskIds: ["build"]
		});
		const scheduler = new TaskScheduler(deps).init();

		expect(scheduler.scheduledTask).toContain("packages:a:build");
		expect(scheduler.scheduledTask).toContain("packages:b:build");
	});
});

describe.concurrent("TaskScheduler — public queries", () => {
	it("getDirectDependencies returns only direct edges, not transitive", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "c", dependsOn: "b" }]);
		const scheduler = new TaskScheduler(deps).init();

		expect([...scheduler.getDirectDependencies("c")]).toEqual(["b"]);
		expect([...scheduler.getDirectDependencies("b")]).toEqual(["a"]);
		expect([...scheduler.getDirectDependencies("a")]).toEqual([]);
	});

	it("getDirectDependencies returns every direct dep of a fan-in", () => {
		const deps = createMockDeps([{ name: "a" }, { name: "b" }, { name: "c", dependsOn: ["a", "b"] }]);
		const scheduler = new TaskScheduler(deps).init();

		expect([...scheduler.getDirectDependencies("c")].sort()).toEqual(["a", "b"]);
	});

	it("getImplicitDeps lists only implicit edges, not explicit ones", () => {
		const deps = createMockDeps(
			[
				{ name: "build", workspaceId: "packages:lib" },
				{ name: "build", workspaceId: "packages:app" }
			],
			{ parallel: true, implicitDependencies: true, workspaceDeps: { "packages:app": ["packages:lib"] } }
		);
		const scheduler = new TaskScheduler(deps).init();

		expect(scheduler.getImplicitDeps("packages:app:build")).toEqual(["packages:lib:build"]);
		expect(scheduler.getImplicitDeps("packages:lib:build")).toEqual([]);
	});

	it("getImplicitDeps excludes a dep already declared explicitly", () => {
		const deps = createMockDeps(
			[
				{ name: "build", workspaceId: "packages:lib" },
				{ name: "build", workspaceId: "packages:app", dependsOn: "packages:lib:build" }
			],
			{ parallel: true, implicitDependencies: true, workspaceDeps: { "packages:app": ["packages:lib"] } }
		);
		const scheduler = new TaskScheduler(deps).init();

		expect(scheduler.getImplicitDeps("packages:app:build")).toEqual([]);
	});

	it("scheduledTask includes every analyzed task", () => {
		const deps = createMockDeps([{ name: "install" }, { name: "build", dependsOn: "install" }]);
		const scheduler = new TaskScheduler(deps).init();

		expect(new Set(scheduler.scheduledTask)).toEqual(new Set(["install", "build"]));
	});
});
