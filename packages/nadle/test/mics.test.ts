import { it, describe } from "vitest";

describe("when not given any tasks", () => {
	it("show all available tasks", async () => {
		await expectPass(exec``);
	});
});
