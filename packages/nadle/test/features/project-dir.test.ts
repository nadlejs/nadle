import Path from "node:path";

import { getStdout } from "setup";
import { it, expect, describe } from "vitest";
import { createExec, fixturesDir } from "setup";

// TODO: Use --config-paths to extract project path value
describe("projectDir", () => {
	const baseDir = Path.join(fixturesDir, "project-dir");

	describe("given a package.json contains nadle.root = true", () => {
		it("should traverse up to find the package", async () => {
			await expect(
				getStdout(createExec({ cwd: Path.join(baseDir, "with-nadle-config", "sub-package", "src") })`--show-config`, {
					serializeAll: true
				})
			).resolves.contain(`"absolutePath": "/ROOT/test/__fixtures__/project-dir/with-nadle-config"`);
		});
	});

	describe("given a npm monorepo", () => {
		it("should traverse up to find the root package", async () => {
			await expect(
				getStdout(createExec({ cwd: Path.join(baseDir, "with-npm", "sub-package", "src") })`--show-config`, {
					serializeAll: true
				})
			).resolves.contain(`"absolutePath": "/ROOT/test/__fixtures__/project-dir/with-npm"`);
		});
	});

	describe("given a pnpm monorepo", () => {
		it("should traverse up to find the root package", async () => {
			await expect(
				getStdout(createExec({ cwd: Path.join(baseDir, "with-pnpm", "sub-package", "src") })`--show-config`, {
					serializeAll: true
				})
			).resolves.contain(`"absolutePath": "/ROOT/test/__fixtures__/project-dir/with-pnpm"`);
		});
	});

	describe("given a yarn monorepo", () => {
		it("should traverse up to find the root package", async () => {
			await expect(
				getStdout(createExec({ cwd: Path.join(baseDir, "with-yarn", "sub-package", "src") })`--show-config`, {
					serializeAll: true
				})
			).resolves.contain(`"absolutePath": "/ROOT/test/__fixtures__/project-dir/with-yarn"`);
		});
	});
});
