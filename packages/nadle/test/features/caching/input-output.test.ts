import Path from "node:path";
import Fs from "node:fs/promises";

import { it, describe, afterEach } from "vitest";
import { createExec, expectPass, fixturesDir } from "setup";

describe("inputs/outputs", () => {
	const cwd = Path.join(fixturesDir, "caching");
	const exec = createExec({ cwd });

	afterEach(async () => {
		await Fs.rmdir(Path.join(cwd, "dist"), { recursive: true });
	});

	it("can print inputs/outputs", async () => {
		await expectPass(exec`bundle-resources --log-level info`);
	});

	it("can resolve inputs by glob", async () => {
		await expectPass(exec`bundle-resources-a --log-level info`);
	});
	it("can resolve outputs by glob", async () => {
		await expectPass(exec`bundle-resources-b --log-level info`);
	});
});
