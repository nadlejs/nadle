import { it, expect, describe } from "vite-plus/test";

import { createMockDeps } from "./__helpers__.js";
import { TaskScheduler } from "../../../src/core/engine/task-scheduler.js";

// A canceled task is terminated, so it must not read as still running. Like the failed
// case, this is a single bounded pass over the indegree map (canProgressInCurrentTree)
// rather than a driven walk: a hang here would kill the worker and vitest would report
// the file as 0-run with a successful exit, so only a direct assertion can fail.
describe("TaskScheduler — a canceled task is not in flight", () => {
	const canProgress = (scheduler: TaskScheduler) => Reflect.get(scheduler, "canProgressInCurrentTree").bind(scheduler) as () => boolean;

	it("reports no progress once the only in-flight task was canceled", () => {
		const deps = createMockDeps([{ name: "canceled" }, { name: "gate", dependsOn: ["canceled"] }], { parallel: false, mainTaskIds: ["gate"] });
		const scheduler = new TaskScheduler(deps).init();

		expect([...scheduler.getReadyTasks()]).toEqual(["canceled"]);
		expect(canProgress(scheduler)()).toBe(true);

		scheduler.markCanceled("canceled");

		// Settled, not failed: nothing in flight, and the dependent is not admitted.
		expect(canProgress(scheduler)()).toBe(false);
	});

	it("does not mark a canceled task as failed", () => {
		const deps = createMockDeps([{ name: "canceled" }, { name: "gate", dependsOn: ["canceled"] }], { parallel: false, mainTaskIds: ["gate"] });
		const scheduler = new TaskScheduler(deps).init();

		scheduler.getReadyTasks();
		scheduler.markCanceled("canceled");

		expect(Reflect.get(scheduler, "failedTaskIds").has("canceled")).toBe(false);
		expect(Reflect.get(scheduler, "settledTaskIds").has("canceled")).toBe(true);
	});
});
