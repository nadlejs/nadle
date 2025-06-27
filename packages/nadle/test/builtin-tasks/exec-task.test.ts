import Path from "node:path";

import { it, describe } from "vitest";
import { createExec, expectPass, fixturesDir } from "setup";

describe("execTask", () => {
	const exec = createExec({ cwd: Path.join(fixturesDir, "exec-task") });

	it.each(["pwd-1", "pwd-2", "pwd-3", "pwd-4", "pwd-5"])("can run %s command with configured workingDir", async (command) => {
		await expectPass(exec`${command}`);
	});
});
