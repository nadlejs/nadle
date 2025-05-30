import { it, describe } from "vitest";

import { exec, expectPass } from "../setup/utils.js";

describe("--show-config", () => {
	it("should show config", async () => {
		await expectPass(exec`hello --show-config`);
	});

	it("should show config with extra options", async () => {
		await expectPass(exec`hello --show-config --min-workers 2 --max-workers 3`);
	});
});
