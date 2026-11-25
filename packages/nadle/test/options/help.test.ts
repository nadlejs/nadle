import { it, describe } from "vite-plus/test";
import { exec, expectPass } from "setup";

describe("--help", () => {
	it("prints help", async () => {
		await expectPass(exec`--help`);
	});
});
