import Path from "node:path";

import { expectFail } from "setup";
import { it, describe } from "vitest";
import { createExec, fixturesDir } from "setup";

describe("graceful cancellation", { retry: 5 }, () => {
	it("should report other running tasks as canceled instead of failed", async () => {
		await expectFail(createExec({ cwd: Path.join(fixturesDir, "graceful-cancellation") })`main-task --max-workers 2`);
	});
});
