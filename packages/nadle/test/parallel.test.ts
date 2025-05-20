import { it, describe } from "vitest";

import { createExec, expectFail, expectPass } from "./utils.js";

describe("Parallel", () => {
	const exec = createExec({ config: "parallel" });

	it("should run tasks parallel", async () => {
		await expectPass(exec`--max-workers 2 task-A`, [{ pattern: /task-A\.[01]/g, replacement: () => "task-A.[01]" }]);
	}, 8000);

	it("should stop on error immediately", async () => {
		await expectFail(() => exec`--max-workers 2 X`, [{ pattern: /task-A\.[12]/g, replacement: () => "task-A.[12]" }]);
	}, 4000);
});
