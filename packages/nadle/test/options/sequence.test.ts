import { it, expect, describe } from "vitest";

import { getStdout, createExec, expectPass } from "../setup/utils.js";

describe("--sequence", () => {
	const exec = createExec({ config: "sequence" });

	it("should run in order 1", async () => {
		const stdout = await getStdout(exec`test compile --sequence`);
		expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
		expect(stdout).toRunInOrder("node", "install", "test");
		expect(stdout).toRunInOrder("test", "compile");
	});

	it("should run in order 2", async () => {
		const stdout = await getStdout(exec`compile test --sequence`);
		expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
		expect(stdout).toRunInOrder("node", "install", "test");
		expect(stdout).toRunInOrder("compile", "test");
	});

	it("should run in order 3", async () => {
		const stdout = await getStdout(exec`test compileTs --sequence`);
		expect(stdout).toRunInOrder("node", "install", "compileTs");
		expect(stdout).toRunInOrder("node", "install", "test");
		expect(stdout).toRunInOrder("test", "compileTs");
	});

	it("should run in order 4", async () => {
		const stdout = await getStdout(exec`compileTs test --sequence`);
		expect(stdout).toRunInOrder("node", "install", "compileTs");
		expect(stdout).toRunInOrder("node", "install", "test");
		expect(stdout).toRunInOrder("compileTs", "test");
	});

	it("should run in order 5", async () => {
		const stdout = await getStdout(exec`node install --sequence`);
		expect(stdout).toRunInOrder("node", "install");
	});

	it("should run in order 6", async () => {
		const stdout = await getStdout(exec`install node --sequence`);
		expect(stdout).toRunInOrder("node", "install");
	});

	it("should run in order 7", async () => {
		const stdout = await getStdout(exec`node --sequence`);
		expect(stdout).toRunInOrder("node");
	});

	it("should run in order 8", async () => {
		const stdout = await getStdout(exec`install --sequence`);
		expect(stdout).toRunInOrder("node", "install");
	});

	describe("with --dry-run", () => {
		const exec = createExec({ config: "abc" });

		it("should list tasks in order 1", async () => {
			await expectPass(exec`task-A task-B --dry-run --sequence`);
		});

		it("should list tasks in order 2", async () => {
			await expectPass(exec`task-B task-A --dry-run --sequence`);
		});

		it("should list tasks in order 3", async () => {
			await expectPass(exec`task-B task-A.2 task-A --dry-run --sequence`);
		});

		it("should list tasks in order 4", async () => {
			await expectPass(exec`task-A.1 task-A.0 task-A.2 task-A --dry-run --sequence`);
		});

		it("should list tasks in order 5", async () => {
			await expectPass(exec`task-C task-A --dry-run --sequence`);
		});

		it("should list tasks in order 6", async () => {
			await expectPass(exec`task-B task-C --dry-run --sequence`);
		});

		it("should list tasks in order 7", async () => {
			await expectPass(exec`task-A.1 task-B task-C --dry-run --sequence`);
		});

		it("should list tasks in order 8", async () => {
			await expectPass(exec`task-B.2 task-A.1 task-B task-C --dry-run --sequence`);
		});
	});
});
