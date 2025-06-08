import { NewExec } from "setup";
import { it, describe } from "vitest";

describe("--dry-run", () => {
	it("should list for one task", async () => {
		await NewExec.expectPass(NewExec.exec`hello --dry-run`);
	});

	it("should list for dependent tasks", async () => {
		await NewExec.expectPass(NewExec.createExec({ config: "depends-on" })`build --dry-run`);
	});
});
