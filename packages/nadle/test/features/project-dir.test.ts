import Path from "node:path";

import { getStdout } from "setup";
import { it, expect, describe } from "vitest";
import { fixture, createExec, fixturesDir, withGeneratedFixture } from "setup";

// TODO: Use --config-paths to extract project path value
describe.concurrent("projectDir", () => {
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

	describe("given a single-package npm repo", () => {
		const files = fixture()
			.packageJson("single-npm")
			.configRaw("")
			.file("package-lock.json", "{}")
			.dir("src")
			.build();

		it("should resolve the project root from a subdirectory", () =>
			withGeneratedFixture({
				files,
				testFn: async ({ cwd }) => {
					const stdout = await getStdout(
						createExec({ cwd: Path.join(cwd, "src") })`--show-config`
					);

					expect(stdout).toContain(`"packageManager": "npm"`);
					expect(stdout).toContain(`"workspaces": []`);
				}
			}));
	});

	describe("given a single-package pnpm repo", () => {
		const files = fixture()
			.packageJson("single-pnpm")
			.configRaw("")
			.file("pnpm-lock.yaml", "lockfileVersion: '9.0'\n")
			.dir("src")
			.build();

		it("should resolve the project root from a subdirectory", () =>
			withGeneratedFixture({
				files,
				testFn: async ({ cwd }) => {
					const stdout = await getStdout(
						createExec({ cwd: Path.join(cwd, "src") })`--show-config`
					);

					expect(stdout).toContain(`"packageManager": "npm"`);
					expect(stdout).toContain(`"workspaces": []`);
				}
			}));
	});

	describe("given a single-package yarn repo", () => {
		const files = fixture()
			.packageJson("single-yarn")
			.configRaw("")
			.file("yarn.lock", "")
			.dir("src")
			.build();

		it("should resolve the project root from a subdirectory", () =>
			withGeneratedFixture({
				files,
				testFn: async ({ cwd }) => {
					const stdout = await getStdout(
						createExec({ cwd: Path.join(cwd, "src") })`--show-config`
					);

					expect(stdout).toContain(`"packageManager": "npm"`);
					expect(stdout).toContain(`"workspaces": []`);
				}
			}));
	});
});
