import { it, vi, expect, describe } from "vitest";

import { type ProjectContext } from "../../src/core/context.js";
import { TaskScheduler } from "../../src/core/engine/task-scheduler.js";
import { type RegisteredTask } from "../../src/core/interfaces/registered-task.js";
import { type TaskConfiguration } from "../../src/core/interfaces/task-configuration.js";

type TaskDef = {
	name: string;
	workspaceId?: string;
	dependsOn?: string | string[];
};

function toTaskId(name: string, workspaceId = "root") {
	return `${workspaceId}:${name}`;
}

function createMockNadle(tasks: TaskDef[], options?: { parallel?: boolean; mainTasks?: string[]; excludedTasks?: string[] }) {
	const taskMap = new Map<string, RegisteredTask>();

	for (const task of tasks) {
		const workspaceId = task.workspaceId ?? "root";
		const id = toTaskId(task.name, workspaceId);

		taskMap.set(id, {
			id,
			workspaceId,
			run: vi.fn(),
			name: task.name,
			label: task.name,
			optionsResolver: undefined,
			configResolver: () => ({ dependsOn: task.dependsOn }) as TaskConfiguration
		});
	}

	const mainTaskDefs = options?.mainTasks ? tasks.filter((t) => options.mainTasks!.includes(t.name)) : tasks;

	return {
		logger: {
			debug: vi.fn(),
			throw: (message: string) => {
				throw new Error(message);
			}
		},
		options: {
			parallel: options?.parallel ?? false,
			excludedTasks: (options?.excludedTasks ?? []).map((id) => ({ taskId: id, rawInput: id, corrected: false })),
			tasks: mainTaskDefs.map((t) => {
				const wid = t.workspaceId ?? "root";

				return { rawInput: t.name, corrected: false, taskId: toTaskId(t.name, wid) };
			})
		},
		taskRegistry: {
			getTaskByName: (name: string) => [...taskMap.values()].filter((t) => t.name === name),
			getTaskById: (id: string) => {
				const task = taskMap.get(id);

				if (!task) {
					throw new Error(`Task ${id} not found`);
				}

				return task;
			},
			parse: (input: string, workspaceId: string) => {
				if (input.includes(":")) {
					return input;
				}

				return workspaceId === "root" ? `root:${input}` : `${workspaceId}:${input}`;
			}
		}
	} as unknown as ProjectContext;
}

describe.concurrent("TaskScheduler", () => {
	describe("linear chain", () => {
		it("schedules tasks in dependency order", () => {
			const nadle = createMockNadle([{ name: "install" }, { name: "build", dependsOn: "install" }, { name: "test", dependsOn: "build" }]);
			const scheduler = new TaskScheduler(nadle).init();
			const plan = scheduler.getExecutionPlan();

			const installIdx = plan.indexOf("root:install");
			const buildIdx = plan.indexOf("root:build");
			const testIdx = plan.indexOf("root:test");

			expect(installIdx).toBeLessThan(buildIdx);
			expect(buildIdx).toBeLessThan(testIdx);
		});

		it("getReadyTasks returns only leaf tasks initially", () => {
			const nadle = createMockNadle([{ name: "install" }, { name: "build", dependsOn: "install" }]);
			const scheduler = new TaskScheduler(nadle).init();
			const ready = scheduler.getReadyTasks();

			expect(ready).toEqual(new Set(["root:install"]));
		});

		it("unblocks next task after dependency completes", () => {
			const nadle = createMockNadle([{ name: "install" }, { name: "build", dependsOn: "install" }]);
			const scheduler = new TaskScheduler(nadle).init();

			scheduler.getReadyTasks(); // initial — install
			const next = scheduler.getReadyTasks("root:install");

			expect(next).toEqual(new Set(["root:build"]));
		});
	});

	describe("diamond dependency", () => {
		it("resolves diamond A → [B, C] → D", () => {
			const nadle = createMockNadle([
				{ name: "A" },
				{ name: "B", dependsOn: "A" },
				{ name: "C", dependsOn: "A" },
				{ name: "D", dependsOn: ["B", "C"] }
			]);
			const scheduler = new TaskScheduler(nadle).init();
			const plan = scheduler.getExecutionPlan();

			expect(plan.indexOf("root:A")).toBeLessThan(plan.indexOf("root:B"));
			expect(plan.indexOf("root:A")).toBeLessThan(plan.indexOf("root:C"));
			expect(plan.indexOf("root:B")).toBeLessThan(plan.indexOf("root:D"));
			expect(plan.indexOf("root:C")).toBeLessThan(plan.indexOf("root:D"));
		});
	});

	describe("parallel tasks", () => {
		it("returns multiple independent tasks as ready", () => {
			const nadle = createMockNadle([{ name: "lint" }, { name: "test" }, { name: "build" }], { parallel: true });
			const scheduler = new TaskScheduler(nadle).init();
			const ready = scheduler.getReadyTasks();

			expect(ready).toEqual(new Set(["root:lint", "root:test", "root:build"]));
		});
	});

	describe("sequential mode", () => {
		it("only runs tasks in current main task tree", () => {
			const nadle = createMockNadle([{ name: "lint" }, { name: "build" }]);
			const scheduler = new TaskScheduler(nadle).init();
			// In sequential mode (parallel=false), mainTaskId is set to first task
			const ready = scheduler.getReadyTasks();

			// Should only return the first task (lint) since it's sequential
			expect(ready).toEqual(new Set(["root:lint"]));
		});
	});

	describe("cycle detection", () => {
		it("throws on direct cycle A → B → A", () => {
			const nadle = createMockNadle([
				{ name: "A", dependsOn: "B" },
				{ name: "B", dependsOn: "A" }
			]);

			expect(() => new TaskScheduler(nadle).init()).toThrow(/Cycle/);
		});

		it("throws on indirect cycle A → B → C → A", () => {
			const nadle = createMockNadle([
				{ name: "A", dependsOn: "C" },
				{ name: "B", dependsOn: "A" },
				{ name: "C", dependsOn: "B" }
			]);

			expect(() => new TaskScheduler(nadle).init()).toThrow(/Cycle/);
		});
	});

	describe("excluded tasks", () => {
		it("filters out excluded dependencies", () => {
			const nadle = createMockNadle([{ name: "install" }, { name: "build", dependsOn: "install" }], {
				mainTasks: ["build"],
				excludedTasks: ["root:install"]
			});
			const scheduler = new TaskScheduler(nadle).init();
			const ready = scheduler.getReadyTasks();

			// build should be immediately ready since its dependency is excluded
			expect(ready).toEqual(new Set(["root:build"]));
		});
	});

	describe("scheduledTask", () => {
		it("includes all analyzed tasks", () => {
			const nadle = createMockNadle([{ name: "install" }, { name: "build", dependsOn: "install" }]);
			const scheduler = new TaskScheduler(nadle).init();

			expect(scheduler.scheduledTask).toContain("root:install");
			expect(scheduler.scheduledTask).toContain("root:build");
		});
	});
});
