import Path from "node:path";

import { it, describe } from "vitest";
import { createExec, expectPass, fixturesDir } from "setup";

describe("workspaces tasks", () => {
	const exec = createExec({ cwd: Path.join(fixturesDir, "pnpm-workspaces") });
	it("should register all tasks from all config files", async () => {
		await expectPass(exec`--list`);
	});

	it("should run tasks as usual", async () => {
		await expectPass(exec`backend:build shared:api:build`);
	});

	it("should run the same task name in workspaces after the main one runs", async () => {
		await expectPass(exec`build --dry-run`);
		await expectPass(exec`build`);
	});

	it("should run the workspace task when using alias", async () => {
		await expectPass(exec`api:build`);
	});
});
