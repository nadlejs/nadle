import * as Path from "node:path";

import { it, describe } from "vitest";

import { createExec, expectFail, expectPass, fixturesDir } from "../utils.js";

describe("Pnpm Task", () => {
	const cwd = Path.join(fixturesDir, "sample-app");
	const exec = createExec({ cwd, config: Path.join(cwd, "pnpm-task.nadle.ts") });

	it("can run tsc command with no error ts file", async () => {
		await expectPass(exec`pass`);
	});

	it("throw error when running tsc command with error ts file", async () => {
		await expectFail(() => exec`fail`);
	});
});
