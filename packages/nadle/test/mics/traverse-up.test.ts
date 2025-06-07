import Path from "node:path";

import { it, describe } from "vitest";
import { createExec, expectPass, fixturesDir } from "setup";

describe("traverse-up", () => {
	const baseDir = Path.join(fixturesDir, "traverse-up");

	it.each(["./a/a1/a11/a112", "./a/a1/a12", "./a/a1", "./a"])("can traverse up to pick the config file from %s", async (path) => {
		await expectPass(createExec({ cwd: Path.join(baseDir, ...path.split("/")) })`hello`);
	});
});
