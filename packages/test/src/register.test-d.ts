import { it, describe, expectTypeOf } from "vitest";
import { tasks, PnpmTask, type ConfigBuilder } from "nadle";

describe("tasks.register", () => {
	it("can register tasks with various signatures", () => {
		expectTypeOf(tasks.register("check")).toEqualTypeOf<ConfigBuilder>();

		expectTypeOf(tasks.register("check", () => console.log("Checking..."))).toEqualTypeOf<ConfigBuilder>();
		expectTypeOf(tasks.register("check", async () => console.log("Checking..."))).toEqualTypeOf<ConfigBuilder>();

		expectTypeOf(tasks.register("eslint", PnpmTask, { args: ["eslint"] })).toEqualTypeOf<ConfigBuilder>();
	});

	it("can configure task metadata", () => {
		expectTypeOf(tasks.register("check").config({ group: "build", dependsOn: ["install"], description: "Check something" })).toEqualTypeOf<void>();
		expectTypeOf(
			tasks.register("check").config(() => ({ group: "build", dependsOn: ["install"], description: "Check something" }))
		).toEqualTypeOf<void>();
	});
});
