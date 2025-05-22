import { it, describe } from "vitest";

import { exec, expectPass } from "../utils.js";

describe("--help", () => {
	it("prints help", async () => {
		await expectPass(exec`--help`);
	});
});
