import { it, expect, describe } from "vitest";

import { createMockDeps } from "./__helpers__.js";
import { TaskScheduler } from "../../../src/core/engine/task-scheduler.js";

describe("TaskScheduler — failure admission", () => {
	it("does not admit a dependent whose indegree hit zero but whose dependency failed", () => {
		const scheduler = new TaskScheduler(createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }], { parallel: true })).init();

		expect(scheduler.getReadyTasks()).toEqual(new Set(["a"]));
		scheduler.markFailed("a");

		expect(scheduler.getReadyTasks("a")).toEqual(new Set());
	});

	it("does not admit a task with a failure deeper in its closure", () => {
		const tasks = [{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "c", dependsOn: "b" }];
		const scheduler = new TaskScheduler(createMockDeps(tasks, { parallel: true })).init();

		scheduler.getReadyTasks();
		scheduler.markFailed("a");
		scheduler.getReadyTasks("a");

		expect(scheduler.getReadyTasks("b")).toEqual(new Set());
	});

	it("still admits a dependent when nothing in its closure failed", () => {
		const scheduler = new TaskScheduler(createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }], { parallel: true })).init();

		scheduler.getReadyTasks();

		expect(scheduler.getReadyTasks("a")).toEqual(new Set(["b"]));
	});

	it("forgets failures when re-initialized", () => {
		const scheduler = new TaskScheduler(createMockDeps([{ name: "a" }, { name: "b", dependsOn: "a" }], { parallel: true })).init();

		scheduler.markFailed("a");
		scheduler.init();
		scheduler.getReadyTasks();

		expect(scheduler.getReadyTasks("a")).toEqual(new Set(["b"]));
	});

	describe("sequential completion", () => {
		const tasks = [{ name: "a" }, { name: "b", dependsOn: "a" }, { name: "x" }, { name: "y", dependsOn: "x" }];

		it("advances to the next main task once the blocked main task can no longer be admitted", () => {
			const scheduler = new TaskScheduler(createMockDeps(tasks, { parallel: false, mainTaskIds: ["b", "y"] })).init();

			expect(scheduler.getReadyTasks()).toEqual(new Set(["a"]));
			scheduler.markFailed("a");

			expect(scheduler.getReadyTasks("a")).toEqual(new Set(["x"]));
		});

		it("does not advance while a task of the current tree is still running", () => {
			const running = [{ name: "a1" }, { name: "a2" }, { name: "b", dependsOn: ["a1", "a2"] }, { name: "x" }];
			const scheduler = new TaskScheduler(createMockDeps(running, { parallel: false, mainTaskIds: ["b", "x"] })).init();

			expect(scheduler.getReadyTasks()).toEqual(new Set(["a1", "a2"]));
			expect(scheduler.getReadyTasks("a1")).toEqual(new Set());
			expect(scheduler.getReadyTasks("a2")).toEqual(new Set(["b"]));
		});

		it("ends the run when the last main task is blocked", () => {
			const scheduler = new TaskScheduler(createMockDeps(tasks, { parallel: false, mainTaskIds: ["b"] })).init();

			scheduler.getReadyTasks();
			scheduler.markFailed("a");

			expect(scheduler.getReadyTasks("a")).toEqual(new Set());
		});
	});
});
