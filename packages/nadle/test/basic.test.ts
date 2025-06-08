import { it, describe } from "vitest";
import { newExec, newExpectPass } from "setup";

describe("Basic", () => {
	it("can run a simple command", async () => {
		await newExpectPass(newExec`hello`);
	});

	it("can run two commands sequentially", async () => {
		await newExpectPass(newExec`hello goodbye`);
	});

	it("can run dependent task first", async () => {
		await newExpectPass(newExec`copy`);
	});
});
