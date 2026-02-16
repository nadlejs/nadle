import { it, describe, expectTypeOf } from "vitest";
import { type Task, defineTask, type TaskFn, type Callback, type Awaitable, type RunnerContext, type DefineTaskParams } from "nadle";

describe.concurrent("defineTask", () => {
	it("accepts DefineTaskParams and returns Task", () => {
		const task = defineTask({
			run({ options, context }) {
				void options;
				void context;
			}
		});
		expectTypeOf(task).toExtend<Task>();
	});

	it("preserves generic Options type", () => {
		const task = defineTask<{ command: string }>({
			run({ options }) {
				expectTypeOf(options).toEqualTypeOf<{ command: string }>();
			}
		});
		expectTypeOf(task).toEqualTypeOf<Task<{ command: string }>>();
	});

	it("DefineTaskParams extends Task", () => {
		expectTypeOf<DefineTaskParams<string>>().toExtend<Task<string>>();
	});

	it("Task.run has correct signature", () => {
		type RunParam = { options: number; context: RunnerContext };
		expectTypeOf<Task<number>["run"]>().toEqualTypeOf<Callback<Awaitable<void>, RunParam>>();
	});

	it("TaskFn is Callback<Awaitable<void>, { context: RunnerContext }>", () => {
		expectTypeOf<TaskFn>().toEqualTypeOf<Callback<Awaitable<void>, { context: RunnerContext }>>();
	});
});
