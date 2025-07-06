import { it, describe } from "vitest";
import { exec, expectPass } from "setup";

describe.skip("abbreviation", () => {
	it("should resolve abbr task properly", async () => {
		await expectPass(exec`hell --stacktrace`);
	});

	it("should log resolved tasks only", async () => {
		await expectPass(exec`hell goodbye cop`);
	});
});
