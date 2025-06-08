import { NewExec } from "setup";
import { it, expect, describe } from "vitest";

describe("dependsOn", { retry: 0, repeats: 3 }, () => {
	const exec = NewExec.createExec({ config: "depends-on" });

	it("should run dependent tasks first 1", async () => {
		const stdout = await NewExec.getStdout(exec`compile`);
		expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
	});

	it("should run dependent tasks first 2", async () => {
		const stdout = await NewExec.getStdout(exec`compile test`);
		expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
		expect(stdout).toRunInOrder("install", "test");
	});

	it("should run dependent tasks first 3", async () => {
		const stdout = await NewExec.getStdout(exec`test compile`);
		expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
		expect(stdout).toRunInOrder("install", "test");
	});

	it("should run dependent tasks first 4", async () => {
		const stdout = await NewExec.getStdout(exec`build`);
		expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
		expect(stdout).toRunInOrder("install", "test");
		expect(stdout).toRunInOrder(["test", "compile"], "build");
	});
});
