import Path from "node:path";

import { it, expect, describe } from "vitest";
import { getStdout, createExec, expectFail, expectPass, fixturesDir } from "setup";

describe("pnpm Task", () => {
	const exec = createExec({ cwd: Path.join(fixturesDir, "pnpm-task") });

	it("can run tsc command with no error ts file", async () => {
		await expectPass(exec`pass`);
	});

	it("can print command when log level = info", async () => {
		await expectPass(exec`pass --log-level info`);
	});

	it("throw error when running tsc command with error ts file", async () => {
		await expectFail(exec`fail`);
	});

	it("prepends --filter flags when filter is set", async () => {
		const stdout = await getStdout(exec`filtered --log-level info`);

		expect(stdout).toContain("Running pnpm command: pnpm --filter @nadle/internal-nadle-test-fixtures-pnpm-task exec echo hello");
	});
});
