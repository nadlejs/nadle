import { it, describe } from "vitest";
import { createExec, expectFail } from "setup";

describe("when passing unknown tasks", () => {
	const exec = createExec({ config: "unknown" });

	it("should throw error without any suggestions if not find any similar tasks", async () => {
		await expectFail(() => exec`unknown`);
	});

	it("should throw error with suggestions if find similar tasks", async () => {
		await expectFail(() => exec`boot`);
		await expectFail(() => exec`build`);
		await expectFail(() => exec`compile`);
	});
});
