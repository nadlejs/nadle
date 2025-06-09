import { it, expect, describe } from "vitest";
import { exec, createExec, expectFail } from "setup";

describe("when register two tasks with the same name", () => {
	it("should throw error", async () => {
		await expect(() => createExec({ config: "duplicate-tasks" })`hello`).rejects.toThrow(`Task "hello" already registered`);
	});
});

describe("when a task fails", () => {
	it("should report correctly", async () => {
		await expectFail(() => exec`throwable`);
	});
});
