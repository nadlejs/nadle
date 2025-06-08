import { it, describe } from "vitest";
import { exec, expectPass } from "setup";

describe.skip("--help", () => {
	it("prints help", async () => {
		await expectPass(exec`--help`);
	});
});
