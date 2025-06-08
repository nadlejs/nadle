import { NewExec } from "setup";
import { it, describe } from "vitest";

describe.skip("--help", () => {
	it("prints help", async () => {
		await NewExec.expectPass(NewExec.exec`--help`);
	});
});
