import { it, describe } from "vitest";
import { exec, createExec, expectPass } from "setup";

describe("--dry-run", () => {
	it("should list for one task", async () => {
		await expectPass(exec`hello --dry-run`);
	});

	it("should list for dependent tasks", async () => {
		await expectPass(createExec({ config: "depends-on" })`build --dry-run`);
	});
});
