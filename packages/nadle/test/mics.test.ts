import { it, describe } from "vitest";
import { exec, expectPass } from "setup";

describe("when not given any tasks", () => {
	it("show all available tasks", async () => {
		await expectPass(exec``);
	});
});
