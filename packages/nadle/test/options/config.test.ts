import { it, describe } from "vitest";
import { fixture, expectPass, withGeneratedFixture } from "setup";

function helloConfig(importLine: string, callExpr: string): string {
	const body = "console.log(`Hello from " + "${" + callExpr + "(import.meta.url)}!`);";

	return [importLine, "", 'import { tasks } from "nadle";', "", 'tasks.register("hello", () => {', "\t" + body, "});", ""].join("\n");
}

const urlConfig = helloConfig('import URL from "node:url";', "URL.fileURLToPath");
const urlLowerConfig = helloConfig('import Url from "node:url";', "Url.fileURLToPath");
const namedImportConfig = helloConfig('import { fileURLToPath } from "node:url";', "fileURLToPath");

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
