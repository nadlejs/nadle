import { NewExec } from "setup";
import { it, describe } from "vitest";

describe("--show-config", () => {
	it("should show config", async () => {
		await NewExec.expectPass(NewExec.exec`hello --show-config`);
	});

	it("should show config with extra options", async () => {
		await NewExec.expectPass(NewExec.exec`hello --show-config --min-workers 2 --max-workers 3`);
	});
});
