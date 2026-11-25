import { it, describe } from "vite-plus/test";
import { exec, expectPass } from "setup";

describe("--show-config", () => {
	it("should show config", async () => {
		await expectPass(exec`hello --show-config`);
	});

	it("should show config with extra options", async () => {
		await expectPass(exec`hello --show-config --min-workers 2 --max-workers 3`);
	});
});
