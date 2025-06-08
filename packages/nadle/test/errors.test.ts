import { NewExec } from "setup";
import { it, expect, describe } from "vitest";

describe("when register two tasks with the same name", () => {
	it.skip("should throw error", async () => {
		await expect(() => NewExec.createExec({ config: "duplicate-tasks" })`hello`).rejects.toThrowError(`Task "hello" already registered`);
	});
});

describe("when a task fails", () => {
	it("should report correctly", async () => {
		await NewExec.expectFail(() => NewExec.exec`throwable`);
	});
});
