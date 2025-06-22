import Path from "node:path";

import { createExec } from "setup";
import { it, expect, describe } from "vitest";
import { getStdout, fixturesDir } from "setup";

describe.concurrent("task-context-working-dir", () => {
	const exec = createExec({ cwd: Path.join(fixturesDir, "task-context-working-dir", "src", "main") });

	it("should resolve correct working dir regarding to the projectDir", async () => {
		await expect(getStdout(exec`withConfiguredWorkingDir`, { serializeAll: true })).resolves.contain(
			"Hello from /ROOT/test/__fixtures__/task-context-working-dir/src/test"
		);
	});

	it("should resolve to projectDir if no given workingDir", async () => {
		await expect(getStdout(exec`withoutWorkingDir`, { serializeAll: true })).resolves.contain(
			"Hello from /ROOT/test/__fixtures__/task-context-working-dir"
		);
	});
});
