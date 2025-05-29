import * as Path from "node:path";

import { it, describe } from "vitest";

import { createExec, expectFail, expectPass, fixturesDir } from "../utils.js";

describe("Pnpm Task", () => {
	const exec = createExec({ cwd: Path.join(fixturesDir, "packages", "pnpm-task") });

	it("can run tsc command with no error ts file", async () => {
		await expectPass(exec`pass`);
	});

	it("throw error when running tsc command with error ts file", async () => {
		await expectFail(() => exec`fail`);
	});
}, 10000);
