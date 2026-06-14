import { it, describe, expectTypeOf } from "vitest";
import { tasks, Inputs, Outputs, CopyTask, PnpmTask, defineSpec, type Task, type TaskConfigurationBuilder, type TaskSpec } from "nadle";

interface OptionalOptions {
	readonly flag?: boolean;
}

const optionalTask: Task<OptionalOptions> = { run: () => {} };

describe.concurrent("tasks.register", () => {
	it("can register tasks with various signatures", () => {
		expectTypeOf(tasks.register("check")).toEqualTypeOf<TaskConfigurationBuilder>();

		expectTypeOf(tasks.register("check", () => console.log("Checking..."))).toEqualTypeOf<TaskConfigurationBuilder>();
		expectTypeOf(tasks.register("check", async () => console.log("Checking..."))).toEqualTypeOf<TaskConfigurationBuilder>();

		expectTypeOf(tasks.register("eslint", PnpmTask, { args: ["eslint"] })).toEqualTypeOf<TaskConfigurationBuilder>();
		expectTypeOf(tasks.register("eslint", PnpmTask, { args: "eslint" })).toEqualTypeOf<TaskConfigurationBuilder>();
	});

	it("can omit the resolver when the task options have no required fields", () => {
		expectTypeOf(tasks.register("opt", optionalTask)).toEqualTypeOf<TaskConfigurationBuilder>();
		expectTypeOf(tasks.register("opt", optionalTask, { flag: true })).toEqualTypeOf<TaskConfigurationBuilder>();
	});

	it("still requires the resolver when the task options have required fields", () => {
		// @ts-expect-error CopyTaskOptions requires `from` and `to`, so the resolver cannot be omitted.
		tasks.register("copy", CopyTask);
	});

	it("can configure task metadata", () => {
		expectTypeOf(tasks.register("check").config({ group: "build", dependsOn: ["install"], description: "Check something" })).toEqualTypeOf<void>();
		expectTypeOf(
			tasks.register("check").config(() => ({ group: "build", dependsOn: ["install"], description: "Check something" }))
		).toEqualTypeOf<void>();
		expectTypeOf(
			tasks.register("check").config({
				group: "build",
				dependsOn: "install",
				description: "Check something",
				inputs: Inputs.files("index.ts"),
				outputs: Outputs.files("index.js")
			})
		).toEqualTypeOf<void>();
	});
});

describe.concurrent("TaskSpec / defineSpec", () => {
	it("TaskSpec<void> allows optional run", () => {
		expectTypeOf<TaskSpec<void>>().toMatchTypeOf<{ run?: unknown }>();
	});

	it("TaskSpec with required options mandates options property", () => {
		type WithReq = TaskSpec<{ command: string }>;
		expectTypeOf<WithReq>().toHaveProperty("options");
	});

	it("defineSpec returns TaskSpec<void> for a plain config object", () => {
		expectTypeOf(defineSpec({ group: "x" })).toMatchTypeOf<TaskSpec<void>>();
	});
});
