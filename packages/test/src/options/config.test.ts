import * as Path from "node:path";

import { it, describe } from "vitest";

import { createExec, expectPass, fixturesDir } from "../utils.js";

describe("--config", () => {
	it.each(["cjs-js", "cjs-ts", "esm-js", "esm-ts"])("should use the existent config path if not specify --config in %s package", async (pkg) => {
		await expectPass(createExec({ cwd: Path.join(fixturesDir, "packages", pkg) })`hello`);
	});

	it("should precedence the js config file over the ts config file", async () => {
		await expectPass(createExec({ cwd: Path.join(fixturesDir, "packages", "mixed-ts-js") })`hello`);
	});

	it("should precedence the ts config file over the mts config file", async () => {
		await expectPass(createExec({ cwd: Path.join(fixturesDir, "packages", "mixed-ts-mts") })`hello`);
	});
});
