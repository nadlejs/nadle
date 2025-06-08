import { NewExec } from "setup";
import { it, describe } from "vitest";

describe("Parallel", () => {
	const exec = NewExec.createExec({ config: "parallel" });

	it("should run tasks parallel", async () => {
		await NewExec.expectPass(exec`--max-workers 2 task-A`, [{ pattern: /task-A\.[01]/g, replacement: () => "task-A.[01]" }]);
	}, 8000);

	it("should stop on error immediately", async () => {
		await NewExec.expectFail(() => exec`--max-workers 2 X`, [{ pattern: /task-A\.[12]/g, replacement: () => "task-A.[12]" }]);
	}, 8000);
});
