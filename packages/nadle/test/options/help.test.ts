import { it, describe } from "vitest";
import { exec, expectPass } from "setup";

describe("--help", () => {
	it("prints help", async () => {
		await expectPass(exec`--help`);
	});
});
