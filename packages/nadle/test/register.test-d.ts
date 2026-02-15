import { it, describe, expectTypeOf } from "vitest";
import { tasks, Inputs, Outputs, PnpmTask, type TaskConfigurationBuilder } from "nadle";

describe.concurrent("tasks.register", () => {
	it("can register tasks with various signatures", () => {
		expectTypeOf(tasks.register("check")).toEqualTypeOf<TaskConfigurationBuilder>();

		expectTypeOf(tasks.register("check", () => console.log("Checking..."))).toEqualTypeOf<TaskConfigurationBuilder>();
		expectTypeOf(tasks.register("check", async () => console.log("Checking..."))).toEqualTypeOf<TaskConfigurationBuilder>();

		expectTypeOf(tasks.register("eslint", PnpmTask, { args: ["eslint"] })).toEqualTypeOf<TaskConfigurationBuilder>();
		expectTypeOf(tasks.register("eslint", PnpmTask, { args: "eslint" })).toEqualTypeOf<TaskConfigurationBuilder>();
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
