import Path from "node:path";
import Fs from "node:fs/promises";

import { execa } from "execa";
import { it, expect, describe } from "vitest";
import { cliPath, withFixture, CONFIG_FILE, PACKAGE_JSON, createPackageJson } from "setup";

describe("overwrite handling", () => {
	it("--yes with existing config skips and exits 0", async () => {
		const originalContent = 'import { tasks } from "nadle";\n// original\n';

		await withFixture({
			fixtureDir: "overwrite",
			files: {
				"package-lock.json": "{}",
				[CONFIG_FILE]: originalContent,
				[PACKAGE_JSON]: createPackageJson("has-config", {
					devDependencies: { nadle: "*" }
				})
			},
			testFn: async ({ cwd }) => {
				const { stdout, exitCode } = await execa(cliPath, ["--yes"], {
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
				"tsconfig.json": "{}",
				"package-lock.json": "{}",
				[PACKAGE_JSON]: createPackageJson("no-config", {
					devDependencies: { nadle: "*" }
				})
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
