import Fs from "node:fs/promises";
import Path from "node:path";

import { execa } from "execa";
import { describe, it, expect } from "vitest";

import { cliPath, withFixture, PACKAGE_JSON, CONFIG_FILE, createPackageJson } from "setup";

describe("non-interactive mode", () => {
	it("--yes flag skips prompts and generates config", async () => {
		await withFixture({
			fixtureDir: "non-interactive",
			files: {
				[PACKAGE_JSON]: createPackageJson("yes-flag", {
					devDependencies: { nadle: "*" }
				}),
				"package-lock.json": "{}",
				"tsconfig.json": "{}"
			},
			testFn: async ({ cwd }) => {
				const { exitCode } = await execa(cliPath, ["--yes"], { cwd });

				expect(exitCode).toBe(0);

				const config = await Fs.readFile(Path.join(cwd, CONFIG_FILE), "utf8");

				expect(config).toContain("tasks");
			}
		});
	});

	it("-y short alias works", async () => {
		await withFixture({
			fixtureDir: "non-interactive",
			files: {
				[PACKAGE_JSON]: createPackageJson("short-alias", {
					devDependencies: { nadle: "*" }
				}),
				"package-lock.json": "{}"
			},
			testFn: async ({ cwd }) => {
				const { exitCode } = await execa(cliPath, ["-y"], { cwd });

				expect(exitCode).toBe(0);

				const config = await Fs.readFile(Path.join(cwd, CONFIG_FILE), "utf8");

				expect(config).toContain("tasks");
			}
		});
	});

	it("non-TTY environment triggers non-interactive mode", async () => {
		await withFixture({
			fixtureDir: "non-interactive",
			files: {
				[PACKAGE_JSON]: createPackageJson("non-tty", {
					devDependencies: { nadle: "*" }
				}),
				"package-lock.json": "{}"
			},
			testFn: async ({ cwd }) => {
				const { exitCode } = await execa(cliPath, [], {
					cwd,
					stdin: "pipe"
				});

				expect(exitCode).toBe(0);

				const config = await Fs.readFile(Path.join(cwd, CONFIG_FILE), "utf8");

				expect(config).toContain("tasks");
			}
		});
	});

	it("--yes with existing config skips with warning", async () => {
		await withFixture({
			fixtureDir: "non-interactive",
			files: {
				[PACKAGE_JSON]: createPackageJson("existing-config", {
					devDependencies: { nadle: "*" }
				}),
				"package-lock.json": "{}",
				[CONFIG_FILE]: 'import { tasks } from "nadle";\n'
			},
			testFn: async ({ cwd }) => {
				const { exitCode, stdout } = await execa(cliPath, ["--yes"], {
					cwd
				});

				expect(exitCode).toBe(0);
				expect(stdout).toContain("already exists");
				expect(stdout).toContain("skipping");
			}
		});
	});
});
