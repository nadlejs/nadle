import Path from "node:path";
import Fs from "node:fs/promises";

import { execa } from "execa";
import { it, expect, describe } from "vitest";
import { cliPath, withFixture, CONFIG_FILE, PACKAGE_JSON, createPackageJson } from "setup";

describe("non-interactive mode", () => {
	it("--yes flag skips prompts and generates config", async () => {
		await withFixture({
			fixtureDir: "non-interactive",
			files: {
				"tsconfig.json": "{}",
				"package-lock.json": "{}",
				[PACKAGE_JSON]: createPackageJson("yes-flag", {
					devDependencies: { nadle: "*" }
				})
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
				"package-lock.json": "{}",
				[PACKAGE_JSON]: createPackageJson("short-alias", {
					devDependencies: { nadle: "*" }
				})
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
				"package-lock.json": "{}",
				[PACKAGE_JSON]: createPackageJson("non-tty", {
					devDependencies: { nadle: "*" }
				})
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
				"package-lock.json": "{}",
				[CONFIG_FILE]: 'import { tasks } from "nadle";\n',
				[PACKAGE_JSON]: createPackageJson("existing-config", {
					devDependencies: { nadle: "*" }
				})
			},
			testFn: async ({ cwd }) => {
				const { stdout, exitCode } = await execa(cliPath, ["--yes"], {
					cwd
				});

				expect(exitCode).toBe(0);
				expect(stdout).toContain("already exists");
				expect(stdout).toContain("skipping");
			}
		});
	});
});
