import { it, describe, expectTypeOf } from "vitest";
import { tasks, CopyTask, PnpmTask, defineSpec, type Task, type TaskSpec } from "nadle";

interface OptionalOptions {
	readonly flag?: boolean;
}

const optionalTask: Task<OptionalOptions> = { run: () => {} };

describe.concurrent("tasks.register", () => {
	it("can register tasks with various signatures", () => {
		expectTypeOf(tasks.register("check")).toEqualTypeOf<void>();

		expectTypeOf(tasks.register("check", () => console.log("Checking..."))).toEqualTypeOf<void>();
		expectTypeOf(tasks.register("check", async () => console.log("Checking..."))).toEqualTypeOf<void>();

		expectTypeOf(tasks.register("eslint", { run: PnpmTask, options: () => ({ args: ["eslint"] }) })).toEqualTypeOf<void>();
		expectTypeOf(tasks.register("eslint", { run: PnpmTask, options: () => ({ args: "eslint" }) })).toEqualTypeOf<void>();
	});

	it("can omit the resolver when the task options have no required fields", () => {
		expectTypeOf(tasks.register("opt", { run: optionalTask })).toEqualTypeOf<void>();
		expectTypeOf(tasks.register("opt", { run: optionalTask, options: () => ({ flag: true }) })).toEqualTypeOf<void>();
	});

	it("still requires the resolver when the task options have required fields", () => {
		// @ts-expect-error CopyTaskOptions requires `from` and `to`, so the resolver cannot be omitted.
		tasks.register("copy", { run: CopyTask });
	});

	it("can configure task metadata via the keyed spec", () => {
		expectTypeOf(tasks.register("check", { group: "build", dependsOn: ["install"], description: "Check something" })).toEqualTypeOf<void>();
	});
});

describe.concurrent("TaskSpec / defineSpec", () => {
	it("TaskSpec<void> allows optional run", () => {
		expectTypeOf<TaskSpec<void>>().toMatchTypeOf<{ run?: unknown }>();
	});

	it("TaskSpec with required options mandates run and options", () => {
		// Both `run` and `options` must be required — omitting either is a type error.
		// @ts-expect-error options (and run) are required when Options has required fields
		const _bad: TaskSpec<{ command: string }> = {};
		const _good: TaskSpec<{ command: string }> = { run: { run: () => {} }, options: { command: "echo" } };
		void _bad;
		void _good;
	});

	it("defineSpec returns TaskSpec<void> for a plain config object", () => {
		expectTypeOf(defineSpec({ group: "x" })).toMatchTypeOf<TaskSpec<void>>();
	});
});
