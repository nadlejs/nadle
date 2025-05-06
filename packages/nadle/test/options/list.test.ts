import { it, expect, describe } from "vitest";

import { createExec } from "../utils.js";

describe("--list", () => {
	it("prints all available tasks", async () => {
		const { stdout } = await createExec()`$0 --list`;
		expect(stdout).toMatchSnapshot();
	});

	it("prints no task message when no registered tasks", async () => {
		const { stdout } = await createExec({ config: "empty" })`$0 --list`;
		expect(stdout).toMatchSnapshot();
	});
});
