import Path from "node:path";
import Fs from "node:fs/promises";

import { it, expect, describe, afterEach } from "vitest";
import { getStdout, createExec, fixturesDir, createFileModifier } from "setup";

describe.skip("inputs/outputs", () => {
	const cwd = Path.join(fixturesDir, "caching");
	const exec = createExec({ cwd });
	const fileModifier = createFileModifier(Path.join(cwd, "resources"));

	afterEach(async () => {
		await Fs.rmdir(Path.join(cwd, "dist"), { recursive: true });
		await Fs.rm(Path.join(cwd, ".nadle"), { force: true, recursive: true });
		await fileModifier.restore();
	});

	it("should miss in the first run", async () => {
		const stdout = await getStdout(exec`bundle-resources --log-level info`);

		expect(stdout).toContain(`Caching bundle-resources miss`);
	});

	it("should hit in the second run if not change the inputs", async () => {
		await exec`bundle-resources`;
		const stdout = await getStdout(exec`bundle-resources --log-level info`);

		expect(stdout).toContain(`Caching bundle-resources hit`);
	});

	it("should miss in the second run if a input file is changed", async () => {
		await exec`bundle-resources`;
		await fileModifier.apply([{ type: "modify", path: "main-input.txt", newContent: "new content" }]);
		const stdout = await getStdout(exec`bundle-resources --log-level info`);

		expect(stdout).toContain(`Caching bundle-resources miss`);
	});

	it("should miss in the second run if a input file is deleted", async () => {
		await exec`bundle-resources`;
		await fileModifier.apply([{ type: "delete", path: "main-input.txt" }]);
		const stdout = await getStdout(exec`bundle-resources --log-level info`);

		expect(stdout).toContain(`Caching bundle-resources miss`);
	});

	it("should miss in the second run if a new file is added", async () => {
		await exec`bundle-resources`;
		await fileModifier.apply([{ type: "add", path: "main-input-2.txt", content: "new file added" }]);
		const stdout = await getStdout(exec`bundle-resources --log-level info`);

		expect(stdout).toContain(`Caching bundle-resources miss`);
	});

	it("should still hit in the third run if a new file is added before the second run and is deleted after", async () => {
		await exec`bundle-resources`;

		await fileModifier.apply([{ type: "add", path: "main-input-3.txt", content: "new file added" }]);
		await exec`bundle-resources`;
		await fileModifier.apply([{ type: "delete", path: "main-input-3.txt" }]);

		const stdout = await getStdout(exec`bundle-resources --log-level info`);

		expect(stdout).toContain(`Caching bundle-resources miss`);
	});
});
