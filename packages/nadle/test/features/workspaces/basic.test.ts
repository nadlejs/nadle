import Path from "node:path";

import { it, describe } from "vitest";
import { createExec, expectPass, fixturesDir } from "setup";

describe("workspaces basic", () => {
	it("should detect workspaces in a basic setup", async () => {
		await expectPass(createExec({ cwd: Path.join(fixturesDir, "pnpm-workspaces") })`--show-config`);
	});
});
