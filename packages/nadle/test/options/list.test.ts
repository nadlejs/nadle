import { NewExec } from "setup";
import { it, describe } from "vitest";

describe("--list", () => {
	it("prints no task message when no registered tasks", async () => {
		await NewExec.expectPass(NewExec.createExec({ config: "empty" })`--list`);
	});

	it("prints all available tasks", async () => {
		await NewExec.expectPass(NewExec.createExec()`--list`);
	});
});
