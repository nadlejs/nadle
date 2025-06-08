import { NewExec } from "setup";
import { it, describe } from "vitest";

describe("Basic", () => {
	it("can run a simple command", async () => {
		await NewExec.expectPass(NewExec.exec`hello`);
	});

	it("can run two commands sequentially", async () => {
		await NewExec.expectPass(NewExec.exec`hello goodbye`);
	});

	it("can run dependent task first", async () => {
		await NewExec.expectPass(NewExec.exec`copy`);
	});
});
