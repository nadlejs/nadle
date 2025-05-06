import { it, expect, describe } from "vitest";

import { exec } from "./utils.js";

describe("when not given any tasks", () => {
	it("show all available tasks", async () => {
		const { stdout } = await exec`$0`;
		expect(stdout).toMatchSnapshot();
	});
});
