import { it, describe } from "vitest";
import { exec, expectPass } from "setup";

describe("abbreviation", () => {
	it("should resolve abbr task properly", async () => {
		await expectPass(exec`hell`);
	});

	it("should log resolved tasks only", async () => {
		await expectPass(exec`hell goodbye cop`);
	});
});
