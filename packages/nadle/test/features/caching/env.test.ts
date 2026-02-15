import Path from "node:path";
import Fs from "node:fs/promises";

import { isWindows } from "std-env";
import { getStdout, createExec, fixturesDir } from "setup";
import { it, expect, describe, afterEach, beforeEach } from "vitest";

describe.skipIf(isWindows)("caching-env", () => {
	const cwd = Path.join(fixturesDir, "caching-env");

	beforeEach(async () => {
		await Fs.rm(Path.join(cwd, "dist"), { force: true, recursive: true });
		await Fs.rm(Path.join(cwd, ".nadle"), { force: true, recursive: true });
	});

	afterEach(async () => {
		await Fs.rm(Path.join(cwd, "dist"), { force: true, recursive: true });
		await Fs.rm(Path.join(cwd, ".nadle"), { force: true, recursive: true });
	});

	it("should be up-to-date when env does not change", async () => {
		const exec = createExec({ cwd, env: { BUILD_MODE: "production" } });

		await exec`bundle-resources`;

		await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "up-to-date");
	});

	it("should miss cache when env changes", async () => {
		const execProd = createExec({ cwd, env: { BUILD_MODE: "production" } });
		const execDev = createExec({ cwd, env: { BUILD_MODE: "development" } });

		await execProd`bundle-resources`;

		await expect(getStdout(execDev`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
	});
});
