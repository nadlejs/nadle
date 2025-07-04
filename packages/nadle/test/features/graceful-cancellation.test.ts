import * as Path from "node:path";

import { expectFail } from "setup";
import { it, describe } from "vitest";
import { createExec, fixturesDir } from "setup";

describe("graceful cancellation", { repeats: 4 }, () => {
	it("should traverse up to find the package", async () => {
		await expectFail(createExec({ cwd: Path.join(fixturesDir, "graceful-cancellation") })`main-task --max-workers 2`);
	});
});
