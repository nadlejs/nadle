import { it, expect, describe } from "vitest";

import { exec } from "../utils.js";

describe("--help", () => {
	it("prints help", async () => {
		const { stdout } = await exec`$0 --help`;
		expect(stdout).toMatchSnapshot();
	});
});
