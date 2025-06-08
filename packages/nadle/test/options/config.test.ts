import * as Path from "node:path";

import { it, describe } from "vitest";
import { NewExec, fixturesDir } from "setup";

describe.skip("--config", () => {
	it.each(["cjs-js", "cjs-ts", "esm-js", "esm-ts"])("should use the existent config path if not specify --config in %s package", async (pkg) => {
		await NewExec.expectPass(NewExec.createExec({ cwd: Path.join(fixturesDir, pkg) })`hello`);
	});

	it("should precedence the js config file over the ts config file", async () => {
		await NewExec.expectPass(NewExec.createExec({ cwd: Path.join(fixturesDir, "mixed-ts-js") })`hello`);
	});

	it("should precedence the ts config file over the mts config file", async () => {
		await NewExec.expectPass(NewExec.createExec({ cwd: Path.join(fixturesDir, "mixed-ts-mts") })`hello`);
	});
});
