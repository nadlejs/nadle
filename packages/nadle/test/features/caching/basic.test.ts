import Path from "node:path";
import Fs from "node:fs/promises";

import { isWindows } from "std-env";
import { it, expect, describe, afterEach, beforeEach } from "vitest";
import { getStdout, createExec, fixturesDir, createFileModifier } from "setup";

describe.skipIf(isWindows)("basic caching", () => {
	const cwd = Path.join(fixturesDir, "caching");
	const exec = createExec({ cwd });
	const fileModifier = createFileModifier(Path.join(cwd));

	beforeEach(async () => {
		await Fs.rm(Path.join(cwd, "dist"), { force: true, recursive: true });
		await Fs.rm(Path.join(cwd, ".nadle"), { force: true, recursive: true });
	});

	afterEach(async () => {
		await Fs.rm(Path.join(cwd, "dist"), { force: true, recursive: true });
		await Fs.rm(Path.join(cwd, ".nadle"), { force: true, recursive: true });
		await fileModifier.restore();
	});

	it("should execute in the first run", async () => {
		await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
	});

	it("should be up-to-date in the second run if inputs do not change", async () => {
		await exec`bundle-resources`;

		await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "up-to-date");
	});

	it("should re-execute in the second run if inputs change", async () => {
		await exec`bundle-resources`;
		await fileModifier.apply([{ type: "modify", newContent: "new content", path: "resources/main-input.txt" }]);

		await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
	});

	it("should re-execute in the second run if a input file is deleted", async () => {
		await exec`bundle-resources`;
		await fileModifier.apply([{ type: "delete", path: "resources/main-input.txt" }]);

		await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
	});

	it("should re-execute in the second run if a new file is added", async () => {
		await exec`bundle-resources`;
		await fileModifier.apply([{ type: "add", content: "new file added", path: "resources/main-input-2.txt" }]);

		await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
	});

	it("should restore from cache in the third run if a file is added before and deleted after the second run", async () => {
		await exec`bundle-resources`;

		await fileModifier.apply([{ type: "add", content: "new file added", path: "resources/main-input-3.txt" }]);
		await exec`bundle-resources`;
		await fileModifier.apply([{ type: "delete", path: "resources/main-input-3.txt" }]);

		await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "from-cache");
	});

	it("should miss cache when config file changes", async () => {
		await exec`bundle-resources`;

		await fileModifier.apply([
			{ type: "modify", path: "nadle.config.ts", newContent: (currentContent) => `${currentContent}\ntasks.register("build");` }
		]);

		await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
	});
});
