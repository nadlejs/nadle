import { it, describe } from "vitest";
import { exec, expectPass } from "setup";

describe.skip("when not given any tasks", () => {
	it("show all available tasks", async () => {
		await expectPass(exec``);
	});
});
