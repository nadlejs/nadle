import Path from "node:path";
import Fs from "node:fs/promises";

import { execa } from "execa";
import { it, expect, describe } from "vitest";
import { cliPath, withFixture, PACKAGE_JSON, PNPM_WORKSPACE, createPackageJson, createPnpmWorkspace } from "setup";

describe("project detection with --yes", () => {
	it("generates config with tsc build task for TypeScript project", async () => {
		await withFixture({
			fixtureDir: "detection",
			files: {
				"tsconfig.json": "{}",
				"package-lock.json": "{}",
				[PACKAGE_JSON]: createPackageJson("ts-project", {
					devDependencies: { nadle: "*" }
				})
			},
			testFn: async ({ cwd }) => {
				const { stdout } = await execa(cliPath, ["--yes"], { cwd });

				expect(stdout).toContain("Detected package manager: npm");
				expect(stdout).toContain("Detected TypeScript project");

				const config = await Fs.readFile(Path.join(cwd, "nadle.config.ts"), "utf8");

				expect(config).toContain("ExecTask");
				expect(config).toContain('"tsc"');
			}
		});
	});

	it("generates config with configure() for pnpm monorepo", async () => {
		await withFixture({
			fixtureDir: "detection",
			files: {
				"pnpm-lock.yaml": "",
				"tsconfig.json": "{}",
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("mono-root", {
					devDependencies: { nadle: "*" }
				})
			},
			testFn: async ({ cwd }) => {
				const { stdout } = await execa(cliPath, ["--yes"], { cwd });

				expect(stdout).toContain("Detected monorepo");

				const config = await Fs.readFile(Path.join(cwd, "nadle.config.ts"), "utf8");

				expect(config).toContain("configure");
				expect(config).toContain("implicitDependencies: true");
			}
		});
	});

	it("generates placeholder build task for JavaScript project", async () => {
		await withFixture({
			fixtureDir: "detection",
			files: {
				"package-lock.json": "{}",
				[PACKAGE_JSON]: createPackageJson("js-project", {
					devDependencies: { nadle: "*" }
				})
			},
			testFn: async ({ cwd }) => {
				await execa(cliPath, ["--yes"], { cwd });

				const config = await Fs.readFile(Path.join(cwd, "nadle.config.ts"), "utf8");

				expect(config).not.toContain("tsc");
				expect(config).toContain('"build"');
				expect(config).toContain("Building project...");
			}
		});
	});

	it("migrates task-like scripts and excludes long-running", async () => {
		await withFixture({
			fixtureDir: "detection",
			files: {
				"tsconfig.json": "{}",
				"package-lock.json": "{}",
				[PACKAGE_JSON]: createPackageJson("scripts-project", {
					devDependencies: { nadle: "*" },
					scripts: {
						build: "tsc",
						test: "vitest",
						start: "node server.js"
					}
				})
			},
			testFn: async ({ cwd }) => {
				const { stdout } = await execa(cliPath, ["--yes"], { cwd });

				expect(stdout).toContain("Auto-migrating 2 task-like scripts");

				const config = await Fs.readFile(Path.join(cwd, "nadle.config.ts"), "utf8");

				expect(config).toContain('"build"');
				expect(config).toContain('"test"');
				expect(config).not.toContain('"start"');
			}
		});
	});

	it("detects root from subdirectory", async () => {
		await withFixture({
			fixtureDir: "detection",
			files: {
				src: {},
				"tsconfig.json": "{}",
				"package-lock.json": "{}",
				[PACKAGE_JSON]: createPackageJson("subdir-project", {
					devDependencies: { nadle: "*" }
				})
			},
			testFn: async ({ cwd }) => {
				const subDir = Path.join(cwd, "src");

				await execa(cliPath, ["--yes"], { cwd: subDir });

				const config = await Fs.readFile(Path.join(cwd, "nadle.config.ts"), "utf8");

				expect(config).toContain('"build"');
			}
		});
	});
});
