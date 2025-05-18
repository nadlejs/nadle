import { it, describe } from "vitest";

import { createExec, expectPass } from "../utils.js";

describe("--list", () => {
	it("prints all available tasks", async () => {
		await expectPass(createExec()`--list`);
	});

	it("prints no task message when no registered tasks", async () => {
		await expectPass(createExec({ config: "empty" })`--list`);
	});
});
