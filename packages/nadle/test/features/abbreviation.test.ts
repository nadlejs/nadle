import { exec, expectPass } from "setup";
import { it, describe } from "vite-plus/test";

describe("abbreviation", () => {
	it("should resolve abbr task properly", async () => {
		await expectPass(exec`hell`);
	});

	it("should log resolved tasks only", async () => {
		await expectPass(exec`hell goodbye cop`);
	});
});
