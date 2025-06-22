import Path from "node:path";
import Fs from "node:fs/promises";

import { isWindows } from "std-env";
import { it, expect, describe, afterEach, beforeEach } from "vitest";
import { getStdout, createExec, fixturesDir, createFileModifier } from "setup";

describe.skipIf(isWindows)("caching-input", () => {
	const cwd = Path.join(fixturesDir, "caching-input");
	const exec = createExec({ cwd });
	const fileModifier = createFileModifier(Path.join(cwd, "resources"));

	beforeEach(async () => {
		await Fs.rm(Path.join(cwd, "dist"), { force: true, recursive: true });
		await Fs.rm(Path.join(cwd, ".nadle"), { force: true, recursive: true });
	});

	afterEach(async () => {
		await Fs.rm(Path.join(cwd, "dist"), { force: true, recursive: true });
		await Fs.rm(Path.join(cwd, ".nadle"), { force: true, recursive: true });
		await fileModifier.restore();
	});

	it("should allow to specify inputs with braces", async () => {
		await exec`bundle-resources --stacktrace`;
		await fileModifier.apply([{ type: "modify", path: "a-input.txt", newContent: "new content" }]);

		await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "up-to-date");
	});
});
