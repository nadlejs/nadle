import Path from "node:path";

import { it, describe } from "vite-plus/test";
import { createExec, expectFail, expectPass, fixturesDir } from "setup";

describe("pnpx Task", () => {
	const exec = createExec({ cwd: Path.join(fixturesDir, "pnpx-task") });

	it("can run tsc command with no error ts file", async () => {
		await expectPass(exec`pass`);
	});

	it("can print command when log level = info", async () => {
		await expectPass(exec`pass --log-level info`);
	});

	// Flaky on tsc 7: it writes the error in random stdout chunks and nadle logs each chunk as a line.
	// Re-enable once child output is line-buffered.
	// oxlint-disable-next-line vitest/no-disabled-tests
	it.skip("throw error when running tsc command with error ts file", async () => {
		await expectFail(exec`fail`);
	});
});
