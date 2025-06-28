import { it, describe } from "vitest";
import { createExec, expectPass } from "setup";

describe("--exclude", () => {
	const exec = createExec({ config: "abc" });
	it("should exclude the specified excluded task", async () => {
		await expectPass(exec`task-A --exclude task-A.0`);
	});

	it("should exclude the specified excluded tasks", async () => {
		await expectPass(exec`task-A --exclude task-A.0,task-A.1`);
	});

	it.skip("should do nothing if it is also the only main specify task", async () => {
		await expectPass(exec`task-A --exclude task-A`);
	});

	it("should run other tasks if it is also the main task", async () => {
		await expectPass(exec`task-A task-B --exclude task-A`);
	});

	it("should work with dry run", async () => {
		await expectPass(exec`task-A --exclude task-A.1 --dry-run`);
	});
});
