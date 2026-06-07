import { it, expect, describe } from "vitest";

import { createMockDeps } from "./__helpers__.js";
import { TaskScheduler } from "../../../src/core/engine/task-scheduler.js";

describe.concurrent("TaskScheduler — cycle detection", () => {
	it("rejects a direct cycle A → B → A", () => {
		const deps = createMockDeps([
			{ name: "a", dependsOn: "b" },
			{ name: "b", dependsOn: "a" }
		]);

		expect(() => new TaskScheduler(deps).init()).toThrow(/Cycle/);
	});

	it("rejects an indirect cycle A → B → C → A", () => {
		const deps = createMockDeps([
			{ name: "a", dependsOn: "c" },
			{ name: "b", dependsOn: "a" },
			{ name: "c", dependsOn: "b" }
		]);

		expect(() => new TaskScheduler(deps).init()).toThrow(/Cycle/);
	});

	it("rejects a cycle formed through implicit workspace deps", () => {
		const deps = createMockDeps(
			[
				{ name: "build", workspaceId: "packages:a" },
				{ name: "build", workspaceId: "packages:b" }
			],
			{
				parallel: true,
				implicitDependencies: true,
				workspaceDeps: { "packages:a": ["packages:b"], "packages:b": ["packages:a"] }
			}
		);

		expect(() => new TaskScheduler(deps).init()).toThrow(/Cycle/);
	});

	it("accepts a graph with no cycle even when workspace deps are circular but tasks are missing", () => {
		const deps = createMockDeps([{ name: "build", workspaceId: "packages:a" }], {
			parallel: true,
			implicitDependencies: true,
			workspaceDeps: { "packages:a": ["packages:b"], "packages:b": ["packages:a"] }
		});

		expect(() => new TaskScheduler(deps).init()).not.toThrow();
	});

	it("does not flag a redundant explicit + implicit edge as a cycle", () => {
		const deps = createMockDeps(
			[
				{ name: "build", workspaceId: "packages:lib" },
				{ name: "build", workspaceId: "packages:app", dependsOn: "packages:lib:build" }
			],
			{
				parallel: true,
				implicitDependencies: true,
				workspaceDeps: { "packages:app": ["packages:lib"] }
			}
		);

		expect(() => new TaskScheduler(deps).init()).not.toThrow();
	});
});
