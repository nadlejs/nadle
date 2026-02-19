import { it, expect, describe } from "vitest";
import { fixture, getStdout, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("depends-on")
	.configRaw(await readConfig("depends-on.ts"))
	.build();

describe.concurrent("dependsOn", () => {
	it("should run dependent tasks first 1", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`compile`);

				expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
			}
		}));

	it("should run dependent tasks first 2", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`compile test`);

				expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
				expect(stdout).toRunInOrder("install", "test");
			}
		}));

	it("should run dependent tasks first 3", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`test compile`);

				expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
				expect(stdout).toRunInOrder("install", "test");
			}
		}));

	it("should run dependent tasks first 4", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build`);

				expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
				expect(stdout).toRunInOrder("install", "test");
				expect(stdout).toRunInOrder(["test", "compile"], "build");
			}
		}));
});
