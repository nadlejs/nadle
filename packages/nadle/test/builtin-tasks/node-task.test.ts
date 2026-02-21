import Path from "node:path";

import { it, describe } from "vitest";
import { createExec, expectFail, expectPass, fixturesDir } from "setup";

describe("node Task", () => {
	const exec = createExec({ cwd: Path.join(fixturesDir, "node-task") });

	it("can run node script with no error", async () => {
		await expectPass(exec`pass`);
	});

	it("can print command when log level = info", async () => {
		await expectPass(exec`pass --log-level info`);
	});

	it("throw error when running node script that exits with error", async () => {
		await expectFail(exec`fail`);
	});
});
