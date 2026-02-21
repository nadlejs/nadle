import Path from "node:path";

import { it, describe } from "vitest";
import { createExec, expectFail, expectPass, fixturesDir } from "setup";

describe("pnpx Task", () => {
	const exec = createExec({ cwd: Path.join(fixturesDir, "pnpx-task") });

	it("can run tsc command with no error ts file", async () => {
		await expectPass(exec`pass`);
	});

	it("can print command when log level = info", async () => {
		await expectPass(exec`pass --log-level info`);
	});

	it("throw error when running tsc command with error ts file", async () => {
		await expectFail(exec`fail`);
	});
});
