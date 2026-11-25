import { exec, expectPass } from "setup";
import { it, describe } from "vite-plus/test";

describe("--help", () => {
	it("prints help", async () => {
		await expectPass(exec`--help`);
	});
});
