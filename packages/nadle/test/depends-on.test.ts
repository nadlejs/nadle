import { it, expect, describe } from "vitest";

import { getStdout, createExec } from "./setup/utils.js";

describe(
	"dependsOn",
	() => {
		const exec = createExec({ config: "depends-on" });

		it("should run dependent tasks first 1", async () => {
			const stdout = await getStdout(exec`compile`);
			expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
		});

		it("should run dependent tasks first 2", async () => {
			const stdout = await getStdout(exec`compile test`);
			expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
			expect(stdout).toRunInOrder("install", "test");
		});

		it("should run dependent tasks first 3", async () => {
			const stdout = await getStdout(exec`test compile`);
			expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
			expect(stdout).toRunInOrder("install", "test");
		});

		it("should run dependent tasks first 3", async () => {
			const stdout = await getStdout(exec`build`);
			expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
			expect(stdout).toRunInOrder("install", "test");
			expect(stdout).toRunInOrder(["test", "compile"], "build");
		});
	},
	{ retry: 0, repeats: 3 }
);
