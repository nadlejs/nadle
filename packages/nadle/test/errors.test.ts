import { it, expect, describe } from "vitest";

import { exec, createExec, expectFail } from "./utils.js";

describe("when register two tasks with the same name", () => {
	it("should throw error", async () => {
		await expect(() => createExec({ config: "duplicate-tasks" })`$0 hello`).rejects.toThrowError(`Task "hello" already registered`);
	});
});

describe("when passing invalid task name", () => {
	it("should throw error", async () => {
		await expectFail(() => exec`$0 unknown`);
	});
});

describe("when a task fails", () => {
	it("should report correctly", async () => {
		await expectFail(() => exec`$0 throwable`);
	});
});
