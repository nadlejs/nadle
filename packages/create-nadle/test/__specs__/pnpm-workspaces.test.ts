import Fs from "node:fs/promises";
import Path from "node:path";

import { execa } from "execa";
import { it, describe, expect } from "vitest";

import { cliPath, withFixture, PACKAGE_JSON, PNPM_WORKSPACE, createPackageJson, createPnpmWorkspace } from "setup";

describe("given a pnpm monorepo project", () => {
	it("should generate a config with monorepo settings", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root", {
					devDependencies: { nadle: "*" }
				}),
				"pnpm-lock.yaml": ""
			},
			testFn: async ({ cwd }) => {
				await execa(cliPath, ["--yes"], { cwd });

				const config = await Fs.readFile(Path.join(cwd, "nadle.config.ts"), "utf8");

				expect(config).toContain("configure");
				expect(config).toContain("implicitDependencies: true");
				expect(config).toContain("tasks");
			}
		});
	});
});
