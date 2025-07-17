import Path from "node:path";

import { it, describe } from "vitest";
import { exec, expectPass, createExec, fixturesDir } from "setup";

describe("--config-key", () => {
	it("should use the specified config key and show correct config", async () => {
		await expectPass(exec`--show-config --config-key project`);
	});

	it("should work with nested key", async () => {
		const exec = createExec({ cwd: Path.join(fixturesDir, "pnpm-workspaces") });
		await expectPass(exec`--show-config --config-key project.rootWorkspace.absolutePath`);
		await expectPass(exec`--show-config --config-key project.workspaces[1]`);
		await expectPass(exec`--show-config --config-key project.workspaces[1].id`);
		await expectPass(exec`--show-config --config-key project.workspaces.1.id`);
		await expectPass(exec`build --show-config --config-key tasks[0].taskId`);
	});

	it("should have no effect if not specified any value", async () => {
		await expectPass(exec`--show-config --config-key`);
	});

	it("should print undefined if config key does not exist", async () => {
		await expectPass(exec`--show-config --config-key notFound`);
	});
});
