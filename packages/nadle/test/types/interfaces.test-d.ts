import { it, describe, expectTypeOf } from "vitest";
import type { Logger, TaskEnv, RunnerContext, TaskConfiguration } from "nadle";

describe.concurrent("RunnerContext", () => {
	it("has logger and workingDir", () => {
		expectTypeOf<RunnerContext["logger"]>().toEqualTypeOf<Logger>();
		expectTypeOf<RunnerContext["workingDir"]>().toEqualTypeOf<string>();
	});
});

describe.concurrent("Logger", () => {
	it("has log, warn, info, error, debug methods", () => {
		expectTypeOf<Logger>().toHaveProperty("log");
		expectTypeOf<Logger>().toHaveProperty("warn");
		expectTypeOf<Logger>().toHaveProperty("info");
		expectTypeOf<Logger>().toHaveProperty("error");
		expectTypeOf<Logger>().toHaveProperty("debug");
	});

	it("has getColumns method", () => {
		expectTypeOf<Logger["getColumns"]>().returns.toEqualTypeOf<number>();
	});
});

describe.concurrent("TaskConfiguration", () => {
	it("has all expected optional fields", () => {
		expectTypeOf<TaskConfiguration>().toHaveProperty("dependsOn");
		expectTypeOf<TaskConfiguration>().toHaveProperty("description");
		expectTypeOf<TaskConfiguration>().toHaveProperty("env");
		expectTypeOf<TaskConfiguration>().toHaveProperty("group");
		expectTypeOf<TaskConfiguration>().toHaveProperty("inputs");
		expectTypeOf<TaskConfiguration>().toHaveProperty("outputs");
		expectTypeOf<TaskConfiguration>().toHaveProperty("workingDir");
	});

	it("env is TaskEnv | undefined", () => {
		expectTypeOf<TaskConfiguration["env"]>().toEqualTypeOf<TaskEnv | undefined>();
	});
});

describe.concurrent("TaskEnv", () => {
	it("is Record<string, string | number | boolean>", () => {
		expectTypeOf<TaskEnv>().toEqualTypeOf<Record<string, string | number | boolean>>();
	});
});
