import { it, describe, expectTypeOf } from "vitest";
import { tasks, type Task, type Logger, type TaskEnv, type RunnerContext, type TaskConfiguration } from "nadle";

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
		expectTypeOf<TaskConfiguration>().toHaveProperty("onlyIf");
		expectTypeOf<TaskConfiguration>().toHaveProperty("timeout");
		expectTypeOf<TaskConfiguration>().toHaveProperty("retries");
		expectTypeOf<TaskConfiguration>().toHaveProperty("maxCacheEntries");
	});

	it("env is TaskEnv | undefined", () => {
		expectTypeOf<TaskConfiguration["env"]>().toEqualTypeOf<TaskEnv | undefined>();
	});
});

describe.concurrent("TaskConfiguration onlyIf", () => {
	type OnlyIf<Options = unknown> = NonNullable<TaskConfiguration<Options>["onlyIf"]>;
	type Params<Options = unknown> = Parameters<OnlyIf<Options>>[0];
	const typedTask: Task<{ command: string }> = { run: () => {} };

	it("accepts a sync boolean predicate", () => {
		expectTypeOf<() => boolean>().toExtend<OnlyIf>();
	});

	it("accepts an async boolean predicate", () => {
		expectTypeOf<() => Promise<boolean>>().toExtend<OnlyIf>();
	});

	it("accepts non-boolean predicates (truthy/falsey contract)", () => {
		expectTypeOf<() => string>().toExtend<OnlyIf>();
		expectTypeOf<() => number>().toExtend<OnlyIf>();
		expectTypeOf<() => undefined>().toExtend<OnlyIf>();
		expectTypeOf<() => object>().toExtend<OnlyIf>();
		expectTypeOf<() => Promise<string | undefined>>().toExtend<OnlyIf>();
	});

	it("rejects a predicate that requires a different parameter shape", () => {
		expectTypeOf<(params: { unrelated: string }) => boolean>().not.toExtend<OnlyIf>();
	});

	it("passes both options and context in one params object", () => {
		expectTypeOf<Params>().toHaveProperty("options");
		expectTypeOf<Params>().toHaveProperty("context");
		expectTypeOf<Params["context"]>().toEqualTypeOf<RunnerContext>();
		expectTypeOf<Params<{ flag: boolean }>["options"]>().toEqualTypeOf<{ flag: boolean }>();
		expectTypeOf<Params["options"]>().toEqualTypeOf<unknown>();
	});

	it("infers options from the registered task inside the predicate", () => {
		tasks.register("typed", {
			run: typedTask,
			options: { command: "echo" },
			onlyIf: ({ options, context }) => {
				expectTypeOf(options).toEqualTypeOf<{ command: string }>();
				expectTypeOf(context).toEqualTypeOf<RunnerContext>();

				return options.command === "echo";
			}
		});
	});

	it("is assignable from a specific TaskConfiguration to the unknown default", () => {
		expectTypeOf<TaskConfiguration<{ flag: boolean }>>().toExtend<TaskConfiguration>();
	});
});

describe.concurrent("TaskEnv", () => {
	it("is Record<string, string | number | boolean>", () => {
		expectTypeOf<TaskEnv>().toEqualTypeOf<Record<string, string | number | boolean>>();
	});
});
