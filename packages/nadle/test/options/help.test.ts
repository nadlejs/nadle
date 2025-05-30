import { it, describe } from "vitest";

import { exec, expectPass } from "../setup/utils.js";

describe("--help", () => {
	it("prints help", async () => {
		await expectPass(exec`--help`);
	});
});
