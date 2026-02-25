import Fs from "node:fs/promises";
import Path from "node:path";

import { execa } from "execa";
import { describe, it, expect } from "vitest";

import { cliPath, withFixture, PACKAGE_JSON, CONFIG_FILE, createPackageJson } from "setup";

describe("overwrite handling", () => {
	it("--yes with existing config skips and exits 0", async () => {
		const originalContent = 'import { tasks } from "nadle";\n// original\n';

		await withFixture({
			fixtureDir: "overwrite",
			files: {
				[PACKAGE_JSON]: createPackageJson("has-config", {
					devDependencies: { nadle: "*" }
				}),
				"package-lock.json": "{}",
				[CONFIG_FILE]: originalContent
			},
			testFn: async ({ cwd }) => {
				const { exitCode, stdout } = await execa(cliPath, ["--yes"], {
					cwd
				});

				expect(exitCode).toBe(0);
				expect(stdout).toContain("already exists");

				const config = await Fs.readFile(Path.join(cwd, CONFIG_FILE), "utf8");

				expect(config).toBe(originalContent);
			}
		});
	});

	it("--yes without existing config generates normally", async () => {
		await withFixture({
			fixtureDir: "overwrite",
			files: {
				[PACKAGE_JSON]: createPackageJson("no-config", {
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
				expect(config).toContain("ExecTask");
			}
		});
	});
});
