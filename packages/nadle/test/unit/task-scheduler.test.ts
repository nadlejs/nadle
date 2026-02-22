import { it, vi, expect, describe } from "vitest";

import { TaskScheduler } from "../../src/core/engine/task-scheduler.js";
import { type SchedulerTask, type SchedulerDependencies } from "../../src/core/engine/scheduler-types.js";

type TaskDef = {
	name: string;
	workspaceId?: string;
	dependsOn?: string | string[];
};

function toTaskId(name: string, workspaceId = "root") {
	if (workspaceId === "root") {
		return name;
	}

	return `${workspaceId}:${name}`;
}

interface MockOptions {
	parallel?: boolean;
	mainTasks?: string[];
	mainTaskIds?: string[];
	excludedTasks?: string[];
	implicitDependencies?: boolean;
	workspaceDeps?: Record<string, string[]>;
}

function createMockDeps(tasks: TaskDef[], options?: MockOptions): SchedulerDependencies {
	const taskMap = new Map<string, SchedulerTask>();

	for (const task of tasks) {
		const workspaceId = task.workspaceId ?? "root";
		const id = toTaskId(task.name, workspaceId);

		taskMap.set(id, {
			id,
			workspaceId,
			name: task.name,
			configResolver: () => ({ dependsOn: task.dependsOn })
		});
	}

	const mainTaskDefs = options?.mainTasks ? tasks.filter((t) => options.mainTasks!.includes(t.name)) : tasks;
	const workspaceDeps = options?.workspaceDeps ?? {};

	const resolvedTasks = options?.mainTaskIds
		? options.mainTaskIds.map((id) => ({ taskId: id, rawInput: id, corrected: false }))
		: mainTaskDefs.map((t) => {
				const wid = t.workspaceId ?? "root";

				return { rawInput: t.name, corrected: false, taskId: toTaskId(t.name, wid) };
			});

	return {
		isRootWorkspace: (workspaceId: string) => workspaceId === "root",
		getWorkspaceDependencies: (wsId: string) => workspaceDeps[wsId] ?? [],
		getTasksByName: (taskName: string) => [...taskMap.values()].filter((t) => t.name === taskName),
		logger: {
			debug: vi.fn(),
			throw: (message: string) => {
				throw new Error(message);
			}
		},
		parseTaskRef: (input: string, workspaceId: string) => {
			if (input.includes(":")) {
				return input;
			}

			return toTaskId(input, workspaceId);
		},
		getTaskById: (taskId: string) => {
			const task = taskMap.get(taskId);

			if (!task) {
				throw new Error(`Task ${taskId} not found`);
			}

			return task;
		},
		options: {
			tasks: resolvedTasks,
			parallel: options?.parallel ?? false,
			implicitDependencies: options?.implicitDependencies ?? false,
			excludedTasks: (options?.excludedTasks ?? []).map((id) => ({ taskId: id, rawInput: id, corrected: false }))
		}
	};
}

describe.concurrent("TaskScheduler", () => {
	describe("linear chain", () => {
		it("schedules tasks in dependency order", () => {
			const deps = createMockDeps([{ name: "install" }, { name: "build", dependsOn: "install" }, { name: "test", dependsOn: "build" }]);
			const scheduler = new TaskScheduler(deps).init();
			const plan = scheduler.getExecutionPlan();

			const installIdx = plan.indexOf("install");
			const buildIdx = plan.indexOf("build");
			const testIdx = plan.indexOf("test");

			expect(installIdx).toBeLessThan(buildIdx);
			expect(buildIdx).toBeLessThan(testIdx);
		});

		it("getReadyTasks returns only leaf tasks initially", () => {
			const deps = createMockDeps([{ name: "install" }, { name: "build", dependsOn: "install" }]);
			const scheduler = new TaskScheduler(deps).init();
			const ready = scheduler.getReadyTasks();

			expect(ready).toEqual(new Set(["install"]));
		});

		it("unblocks next task after dependency completes", () => {
			const deps = createMockDeps([{ name: "install" }, { name: "build", dependsOn: "install" }]);
			const scheduler = new TaskScheduler(deps).init();

			scheduler.getReadyTasks(); // initial — install
			const next = scheduler.getReadyTasks("install");

			expect(next).toEqual(new Set(["build"]));
		});
	});

	describe("diamond dependency", () => {
		it("resolves diamond A → [B, C] → D", () => {
			const deps = createMockDeps([
				{ name: "A" },
				{ name: "B", dependsOn: "A" },
				{ name: "C", dependsOn: "A" },
				{ name: "D", dependsOn: ["B", "C"] }
			]);
			const scheduler = new TaskScheduler(deps).init();
			const plan = scheduler.getExecutionPlan();

			expect(plan.indexOf("A")).toBeLessThan(plan.indexOf("B"));
			expect(plan.indexOf("A")).toBeLessThan(plan.indexOf("C"));
			expect(plan.indexOf("B")).toBeLessThan(plan.indexOf("D"));
			expect(plan.indexOf("C")).toBeLessThan(plan.indexOf("D"));
		});
	});

	describe("parallel tasks", () => {
		it("returns multiple independent tasks as ready", () => {
			const deps = createMockDeps([{ name: "lint" }, { name: "test" }, { name: "build" }], { parallel: true });
			const scheduler = new TaskScheduler(deps).init();
			const ready = scheduler.getReadyTasks();

			expect(ready).toEqual(new Set(["lint", "test", "build"]));
		});
	});

	describe("sequential mode", () => {
		it("only runs tasks in current main task tree", () => {
			const deps = createMockDeps([{ name: "lint" }, { name: "build" }]);
			const scheduler = new TaskScheduler(deps).init();
			const ready = scheduler.getReadyTasks();

			expect(ready).toEqual(new Set(["lint"]));
		});
	});

	describe("cycle detection", () => {
		it("throws on direct cycle A → B → A", () => {
			const deps = createMockDeps([
				{ name: "A", dependsOn: "B" },
				{ name: "B", dependsOn: "A" }
			]);

			expect(() => new TaskScheduler(deps).init()).toThrow(/Cycle/);
		});

		it("throws on indirect cycle A → B → C → A", () => {
			const deps = createMockDeps([
				{ name: "A", dependsOn: "C" },
				{ name: "B", dependsOn: "A" },
				{ name: "C", dependsOn: "B" }
			]);

			expect(() => new TaskScheduler(deps).init()).toThrow(/Cycle/);
		});
	});

	describe("excluded tasks", () => {
		it("filters out excluded dependencies", () => {
			const deps = createMockDeps([{ name: "install" }, { name: "build", dependsOn: "install" }], {
				mainTasks: ["build"],
				excludedTasks: ["install"]
			});
			const scheduler = new TaskScheduler(deps).init();
			const ready = scheduler.getReadyTasks();

			expect(ready).toEqual(new Set(["build"]));
		});
	});

	describe("scheduledTask", () => {
		it("includes all analyzed tasks", () => {
			const deps = createMockDeps([{ name: "install" }, { name: "build", dependsOn: "install" }]);
			const scheduler = new TaskScheduler(deps).init();

			expect(scheduler.scheduledTask).toContain("install");
			expect(scheduler.scheduledTask).toContain("build");
		});
	});

	describe("implicit dependencies", () => {
		it("adds edges from workspace deps when enabled", () => {
			const deps = createMockDeps(
				[
					{ name: "build", workspaceId: "packages:lib" },
					{ name: "build", workspaceId: "packages:app" }
				],
				{
					parallel: true,
					implicitDependencies: true,
					workspaceDeps: { "packages:app": ["packages:lib"] }
				}
			);
			const scheduler = new TaskScheduler(deps).init();
			const plan = scheduler.getExecutionPlan();

			expect(plan.indexOf("packages:lib:build")).toBeLessThan(plan.indexOf("packages:app:build"));
		});

		it("tracks implicit edges via getImplicitDeps", () => {
			const deps = createMockDeps(
				[
					{ name: "build", workspaceId: "packages:lib" },
					{ name: "build", workspaceId: "packages:app" }
				],
				{
					parallel: true,
					implicitDependencies: true,
					workspaceDeps: { "packages:app": ["packages:lib"] }
				}
			);
			const scheduler = new TaskScheduler(deps).init();

			expect(scheduler.getImplicitDeps("packages:app:build")).toEqual(["packages:lib:build"]);
			expect(scheduler.getImplicitDeps("packages:lib:build")).toEqual([]);
		});

		it("does not track explicit deps as implicit", () => {
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
			const scheduler = new TaskScheduler(deps).init();

			// Explicit dep already covered it — should NOT be marked as implicit
			expect(scheduler.getImplicitDeps("packages:app:build")).toEqual([]);
		});

		it("does NOT add implicit edges when disabled", () => {
			const deps = createMockDeps(
				[
					{ name: "build", workspaceId: "packages:lib" },
					{ name: "build", workspaceId: "packages:app" }
				],
				{
					parallel: true,
					implicitDependencies: false,
					workspaceDeps: { "packages:app": ["packages:lib"] }
				}
			);
			const scheduler = new TaskScheduler(deps).init();
			const ready = scheduler.getReadyTasks();

			// Both should be ready simultaneously (no implicit ordering)
			expect(ready).toContain("packages:lib:build");
			expect(ready).toContain("packages:app:build");
		});

		it("deduplicates explicit and implicit dep to same target", () => {
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
			// Should not throw and should have correct ordering
			const scheduler = new TaskScheduler(deps).init();
			const plan = scheduler.getExecutionPlan();

			expect(plan.indexOf("packages:lib:build")).toBeLessThan(plan.indexOf("packages:app:build"));
		});

		it("implicit deps respect --exclude filtering", () => {
			const deps = createMockDeps(
				[
					{ name: "build", workspaceId: "packages:lib" },
					{ name: "build", workspaceId: "packages:app" }
				],
				{
					parallel: true,
					implicitDependencies: true,
					excludedTasks: ["packages:lib:build"],
					workspaceDeps: { "packages:app": ["packages:lib"] }
				}
			);
			const scheduler = new TaskScheduler(deps).init();
			const ready = scheduler.getReadyTasks();

			// app:build should be immediately ready since lib:build is excluded
			expect(ready).toContain("packages:app:build");
		});
	});

	describe("cycle detection with implicit deps", () => {
		it("detects cycle from circular workspace deps", () => {
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

		it("no cycle when only one workspace has the task", () => {
			const deps = createMockDeps([{ name: "build", workspaceId: "packages:a" }], {
				parallel: true,
				implicitDependencies: true,
				workspaceDeps: { "packages:a": ["packages:b"], "packages:b": ["packages:a"] }
			});

			// No cycle because packages:b has no "build" task — implicit dep is skipped
			expect(() => new TaskScheduler(deps).init()).not.toThrow();
		});

		it("no false cycle from redundant explicit + implicit edge", () => {
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

		it("detects long implicit chain cycle", () => {
			const deps = createMockDeps(
				[
					{ name: "build", workspaceId: "packages:a" },
					{ name: "build", workspaceId: "packages:b" },
					{ name: "build", workspaceId: "packages:c" }
				],
				{
					parallel: true,
					implicitDependencies: true,
					workspaceDeps: {
						"packages:a": ["packages:c"],
						"packages:b": ["packages:a"],
						"packages:c": ["packages:b"]
					}
				}
			);

			expect(() => new TaskScheduler(deps).init()).toThrow(/Cycle/);
		});
	});

	describe("root task aggregation", () => {
		it("root build runs after all child workspace builds", () => {
			const deps = createMockDeps(
				[{ name: "build" }, { name: "build", workspaceId: "packages:lib" }, { name: "build", workspaceId: "packages:app" }],
				{ parallel: true, mainTaskIds: ["build"], implicitDependencies: true }
			);
			const scheduler = new TaskScheduler(deps).init();
			const plan = scheduler.getExecutionPlan();

			expect(plan.indexOf("packages:lib:build")).toBeLessThan(plan.indexOf("build"));
			expect(plan.indexOf("packages:app:build")).toBeLessThan(plan.indexOf("build"));
		});

		it("root build aggregates with implicit workspace deps", () => {
			const deps = createMockDeps(
				[{ name: "build" }, { name: "build", workspaceId: "packages:lib" }, { name: "build", workspaceId: "packages:app" }],
				{
					parallel: true,
					mainTaskIds: ["build"],
					implicitDependencies: true,
					workspaceDeps: { "packages:app": ["packages:lib"] }
				}
			);
			const scheduler = new TaskScheduler(deps).init();
			const plan = scheduler.getExecutionPlan();

			expect(plan.indexOf("packages:lib:build")).toBeLessThan(plan.indexOf("packages:app:build"));
			expect(plan.indexOf("packages:app:build")).toBeLessThan(plan.indexOf("build"));
		});

		it("does not aggregate when implicitDependencies is false", () => {
			const deps = createMockDeps(
				[{ name: "build" }, { name: "build", workspaceId: "packages:lib" }, { name: "build", workspaceId: "packages:app" }],
				{ parallel: true, mainTaskIds: ["build"], implicitDependencies: false }
			);
			const scheduler = new TaskScheduler(deps).init();
			const ready = scheduler.getReadyTasks();

			// All three should be immediately ready (no aggregation deps)
			expect(ready).toContain("build");
			expect(ready).toContain("packages:lib:build");
			expect(ready).toContain("packages:app:build");
		});

		it("aggregation respects excluded tasks", () => {
			const deps = createMockDeps(
				[{ name: "build" }, { name: "build", workspaceId: "packages:lib" }, { name: "build", workspaceId: "packages:app" }],
				{
					parallel: true,
					mainTaskIds: ["build"],
					implicitDependencies: true,
					excludedTasks: ["packages:lib:build"]
				}
			);
			const scheduler = new TaskScheduler(deps).init();
			const ready = scheduler.getReadyTasks();

			// lib:build and app:build are both immediately ready (lib:build excluded from aggregation)
			expect(ready).toContain("packages:lib:build");
			expect(ready).toContain("packages:app:build");
			// root build not yet ready because it still depends on non-excluded app:build
			expect(ready).not.toContain("build");
		});

		it("root build with explicit dependsOn and aggregation", () => {
			const deps = createMockDeps(
				[
					{ name: "install" },
					{ name: "build", dependsOn: "install" },
					{ name: "build", workspaceId: "packages:lib" },
					{ name: "build", workspaceId: "packages:app" }
				],
				{ parallel: true, mainTaskIds: ["build"], implicitDependencies: true }
			);
			const scheduler = new TaskScheduler(deps).init();
			const plan = scheduler.getExecutionPlan();

			expect(plan.indexOf("install")).toBeLessThan(plan.indexOf("build"));
			expect(plan.indexOf("packages:lib:build")).toBeLessThan(plan.indexOf("build"));
			expect(plan.indexOf("packages:app:build")).toBeLessThan(plan.indexOf("build"));
		});

		it("no aggregation when root has no child same-name tasks", () => {
			const deps = createMockDeps([{ name: "lint" }, { name: "build", workspaceId: "packages:lib" }], {
				parallel: true,
				mainTaskIds: ["lint"],
				implicitDependencies: true
			});
			const scheduler = new TaskScheduler(deps).init();
			const ready = scheduler.getReadyTasks();

			expect(ready).toContain("lint");
		});
	});

	describe("performance", () => {
		it("schedules 500 tasks across 100 workspaces in under 100ms", () => {
			const workspaceCount = 100;
			const tasksPerWorkspace = 5;
			const taskNames = ["build", "test", "lint", "check", "deploy"];
			const tasks: TaskDef[] = [];

			// Create a chain of workspace deps: ws-1 -> ws-0, ws-2 -> ws-1, etc.
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

			const deps = createMockDeps(tasks, {
				workspaceDeps,
				parallel: true,
				implicitDependencies: true
			});

			const start = performance.now();
			const scheduler = new TaskScheduler(deps).init();
			scheduler.getExecutionPlan();
			const elapsed = performance.now() - start;

			expect(elapsed).toBeLessThan(100);
			expect(scheduler.scheduledTask).toHaveLength(workspaceCount * tasksPerWorkspace);
		});
	});
});
