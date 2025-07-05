import Path from "node:path";

import { it, describe } from "vitest";
import { createExec, expectPass, fixturesDir } from "setup";

describe("workspaces tasks", () => {
	const exec = createExec({ cwd: Path.join(fixturesDir, "pnpm-workspaces") });
	it("should register all tasks from all config files", async () => {
		await expectPass(exec`--list`);
	});

	it("should run tasks as usual", async () => {
		await expectPass(exec`backend:build shared:api:build build`);
	});
});
