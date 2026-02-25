import Fs from "node:fs/promises";
import Path from "node:path";

import { execa } from "execa";
import { describe, it, expect } from "vitest";

import { cliPath, withFixture, PACKAGE_JSON, CONFIG_FILE, createPackageJson } from "setup";

describe("script migration", () => {
	it("migrates simple scripts as ExecTask", async () => {
		await withFixture({
			fixtureDir: "migration",
			files: {
				[PACKAGE_JSON]: createPackageJson("simple", {
					devDependencies: { nadle: "*" },
					scripts: { build: "tsc", test: "vitest" }
				}),
				"package-lock.json": "{}"
			},
			testFn: async ({ cwd }) => {
				await execa(cliPath, ["--yes"], { cwd });

				const config = await Fs.readFile(Path.join(cwd, CONFIG_FILE), "utf8");

				expect(config).toContain("ExecTask");
				expect(config).toContain('"build"');
				expect(config).toContain('command: "tsc"');
				expect(config).toContain('"test"');
				expect(config).toContain('command: "vitest"');
			}
		});
	});

	it("resolves pre/post dependencies", async () => {
		await withFixture({
			fixtureDir: "migration",
			files: {
				[PACKAGE_JSON]: createPackageJson("pre-post", {
					devDependencies: { nadle: "*" },
					scripts: {
						prebuild: "rimraf dist",
						build: "tsc"
					}
				}),
				"package-lock.json": "{}"
			},
			testFn: async ({ cwd }) => {
				await execa(cliPath, ["--yes"], { cwd });

				const config = await Fs.readFile(Path.join(cwd, CONFIG_FILE), "utf8");

				expect(config).toContain("DeleteTask");
				expect(config).toContain('"prebuild"');
				expect(config).toContain('dependsOn: ["prebuild"]');
			}
		});
	});

	it("excludes lifecycle scripts", async () => {
		await withFixture({
			fixtureDir: "migration",
			files: {
				[PACKAGE_JSON]: createPackageJson("lifecycle", {
					devDependencies: { nadle: "*" },
					scripts: {
						build: "tsc",
						prepare: "husky",
						postinstall: "patch-package"
					}
				}),
				"package-lock.json": "{}"
			},
			testFn: async ({ cwd }) => {
				await execa(cliPath, ["--yes"], { cwd });

				const config = await Fs.readFile(Path.join(cwd, CONFIG_FILE), "utf8");

				expect(config).toContain('"build"');
				expect(config).not.toContain('"prepare"');
				expect(config).not.toContain("husky");
				expect(config).not.toContain("patch-package");
			}
		});
	});

	it("excludes long-running scripts", async () => {
		await withFixture({
			fixtureDir: "migration",
			files: {
				[PACKAGE_JSON]: createPackageJson("long-running", {
					devDependencies: { nadle: "*" },
					scripts: {
						build: "tsc",
						dev: "next dev",
						start: "node server.js"
					}
				}),
				"package-lock.json": "{}"
			},
			testFn: async ({ cwd }) => {
				await execa(cliPath, ["--yes"], { cwd });

				const config = await Fs.readFile(Path.join(cwd, CONFIG_FILE), "utf8");

				expect(config).toContain('"build"');
				expect(config).not.toContain('"dev"');
				expect(config).not.toContain('"start"');
			}
		});
	});

	it("transforms task names correctly", async () => {
		await withFixture({
			fixtureDir: "migration",
			files: {
				[PACKAGE_JSON]: createPackageJson("name-transform", {
					devDependencies: { nadle: "*" },
					scripts: {
						"build:prod": "tsc",
						type_check: "tsc --noEmit"
					}
				}),
				"package-lock.json": "{}"
			},
			testFn: async ({ cwd }) => {
				await execa(cliPath, ["--yes"], { cwd });

				const config = await Fs.readFile(Path.join(cwd, CONFIG_FILE), "utf8");

				expect(config).toContain('"build-prod"');
				expect(config).toContain('"type-check"');
			}
		});
	});
});
