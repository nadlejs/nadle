import Path from "node:path";

import { it, describe } from "vitest";
import { expectFail, createExec, expectPass, fixturesDir } from "setup";

describe("workspaces tasks", () => {
	const projectDir = Path.join(fixturesDir, "pnpm-workspaces");
	const exec = createExec({ cwd: projectDir });

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

	it("should run the workspace task when executing from that workspace unless specifying workspace explicitly", async () => {
		await expectPass(createExec({ cwd: Path.join(projectDir, "frontend") })`check`);
		await expectPass(createExec({ cwd: Path.join(projectDir, "shared", "api") })`build`);
		await expectPass(createExec({ cwd: Path.join(projectDir, "shared", "types") })`root:check`);
		await expectPass(createExec({ cwd: Path.join(projectDir, "shared", "types") })`frontend:check`);
	});

	it("task resolvation", async () => {
		const exec = createExec({ cwd: Path.join(projectDir, "frontend") });

		await expectPass(exec`biuld backend:biuld deplyo`);
		await expectPass(exec`fronte:build backe:biuld`);

		await expectFail(exec`prepare`);
		await expectFail(exec`unknown:build`);
		await expectFail(exec`end:build`);
	});

	it.todo("test root aliasing");
	it.todo("test --exclude");
	it.todo("test configure calling from workspace configure file");
});
