import Os from "node:os";
import Path from "node:path";
import Fs from "node:fs/promises";

import { it, expect, describe } from "vitest";
import { settle, fixture, expectPass, withGeneratedFixture } from "setup";

function helloConfig(importLine: string): string {
	return [importLine, "", 'import { tasks } from "nadle";', "", 'tasks.register("hello");', ""].join("\n");
}

const urlConfig = helloConfig('import URL from "node:url";');
const urlLowerConfig = helloConfig('import Url from "node:url";');
const namedImportConfig = helloConfig('import { fileURLToPath } from "node:url";');

const fixtures = {
	"esm-ts": fixture().packageJson("esm-ts").configRaw(urlConfig).build(),
	"esm-js": fixture().packageJson("esm-js").configRaw(urlLowerConfig, "nadle.config.js").build(),
	"cjs-js": fixture().packageJson("cjs-js", { type: "commonjs" }).configRaw(urlConfig, "nadle.config.js").build(),
	"cjs-ts": fixture().packageJson("cjs-ts", { type: "commonjs" }).configRaw(urlConfig, "nadle.config.mts").build(),
	"mixed-ts-mts": fixture().packageJson("mixed-ts-mts", { type: "commonjs" }).configRaw(urlConfig).configRaw(urlConfig, "nadle.config.mts").build(),
	"mixed-ts-js": fixture()
		.packageJson("mixed-ts-js", { type: "commonjs" })
		.configRaw(namedImportConfig)
		.configRaw(urlConfig, "nadle.config.js")
		.build()
};

describe("--config", () => {
	it.each(["cjs-js", "cjs-ts", "esm-js", "esm-ts"] as const)("should use the existent config path if not specify --config in %s package", (pkg) =>
		withGeneratedFixture({
			files: fixtures[pkg]!,
			testFn: async ({ exec }) => {
				await expectPass(exec`hello`);
			}
		})
	);

	it("should precedence the js config file over the ts config file", () =>
		withGeneratedFixture({
			files: fixtures["mixed-ts-js"]!,
			testFn: async ({ exec }) => {
				await expectPass(exec`hello`);
			}
		}));

	it("should precedence the ts config file over the mts config file", () =>
		withGeneratedFixture({
			files: fixtures["mixed-ts-mts"]!,
			testFn: async ({ exec }) => {
				await expectPass(exec`hello`);
			}
		}));
});

describe("--config failures", () => {
	const validFiles = () => fixture().packageJson("config-failures").configRaw(helloConfig('import Url from "node:url";')).build();

	it("should report a missing config file with exit code 2", () =>
		withGeneratedFixture({
			files: validFiles(),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`--config does-not-exist.config.ts hello`);

				expect(exitCode).toBe(2);
				expect(stdout + stderr).toContain("Config file not found at");
			}
		}));

	it("should explain a config outside the project root that cannot resolve nadle", () =>
		withGeneratedFixture({
			files: validFiles(),
			testFn: async ({ exec }) => {
				const outsideDir = await Fs.mkdtemp(Path.join(Os.tmpdir(), "nadle-outside-config-"));
				const outsideConfig = Path.join(outsideDir, "outside.config.ts");

				try {
					await Fs.writeFile(outsideConfig, helloConfig('import Url from "node:url";'));

					const { stdout, stderr, exitCode } = await settle(exec`--config ${outsideConfig} hello`);

					expect(exitCode).toBe(2);
					expect(stdout + stderr).toContain("Failed to load config file");
					expect(stdout + stderr).toContain(outsideConfig);
				} finally {
					await Fs.rm(outsideDir, { force: true, recursive: true });
				}
			}
		}));
});
