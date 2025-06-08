import { it, describe } from "vitest";
import { exec, expectPass } from "setup";

describe("Basic", () => {
	it("can run a simple command", async () => {
		await expectPass(exec`hello`);
	});

	it("can run two commands sequentially", async () => {
		await expectPass(exec`hello goodbye`);
	});

	it("can run dependent task first", async () => {
		await expectPass(exec`copy`);
	});
});
