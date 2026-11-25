import { exec, expectPass } from "setup";
import { it, describe } from "vite-plus/test";

describe("--show-config", () => {
	it("should show config", async () => {
		await expectPass(exec`hello --show-config`);
	});

	it("should show config with extra options", async () => {
		await expectPass(exec`hello --show-config --min-workers 2 --max-workers 3`);
	});
});
