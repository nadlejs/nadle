import { it, expect, describe } from "vitest";
import { getStdout, createExec, expectPass } from "setup";

describe("basic", () => {
	const exec = createExec({ config: "basic" });

	describe("single command", () => {
		it("can run a simple command 1", async () => {
			await expect(getStdout(exec`node`)).resolves.toRunInOrder("node");
		});

		it("can run a simple command 2", async () => {
			await expect(getStdout(exec`install`)).resolves.toRunInOrder("node", "install");
		});

		it("can run a simple command 3", async () => {
			await expectPass(exec`compile`);
		});

		it("can run a simple command 4", async () => {
			await expectPass(exec`test`);
		});
	});

	describe("multiple commands", () => {
		it("should run in order 1", async () => {
			const stdout = await getStdout(exec`test compileTs`);

			expect(stdout).toRunInOrder("node", "install", "compileTs");
			expect(stdout).toRunInOrder("node", "install", "test");
			expect(stdout).toRunInOrder("test", "compileTs");
		});

		it("should run in order 2", async () => {
			const stdout = await getStdout(exec`test compile`);

			expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
			expect(stdout).toRunInOrder("node", "install", "test");
			expect(stdout).toRunInOrder("test", "compile");
		});
		it("should run in order 3", async () => {
			const stdout = await getStdout(exec`compileTs test`);

			expect(stdout).toRunInOrder("node", "install", "compileTs");
			expect(stdout).toRunInOrder("node", "install", "test");
			expect(stdout).toRunInOrder("compileTs", "test");
		});

		it("should run in order 4", async () => {
			const stdout = await getStdout(exec`compile test`);

			expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
			expect(stdout).toRunInOrder("node", "install", "test");
			expect(stdout).toRunInOrder("compile", "test");
		});

		it("should run in order 5", async () => {
			await expect(getStdout(exec`node install`)).resolves.toRunInOrder("node", "install");
		});

		it("should run in order 6", async () => {
			await expect(getStdout(exec`install node`)).resolves.toRunInOrder("node", "install");
		});

		it("should run in order 7", { timeout: 10000 }, async () => {
			await expect(getStdout(exec`slow fast`)).resolves.toRunInOrder("slow", "fast");
		});

		it("should run in order 8", { timeout: 10000 }, async () => {
			await expect(getStdout(exec`fast slow`)).resolves.toRunInOrder("fast", "slow");
		});
	});

	describe("with --dry-run", () => {
		const exec = createExec({ config: "abc" });

		it("should list tasks in order 1", async () => {
			await expectPass(exec`task-A task-B --dry-run`);
		});

		it("should list tasks in order 2", async () => {
			await expectPass(exec`task-B task-A --dry-run`);
		});

		it("should list tasks in order 3", async () => {
			await expectPass(exec`task-B task-A.2 task-A --dry-run`);
		});

		it("should list tasks in order 4", async () => {
			await expectPass(exec`task-A.1 task-A.0 task-A.2 task-A --dry-run`);
		});

		it("should list tasks in order 5", async () => {
			await expectPass(exec`task-C task-A --dry-run`);
		});

		it("should list tasks in order 6", async () => {
			await expectPass(exec`task-B task-C --dry-run`);
		});

		it("should list tasks in order 7", async () => {
			await expectPass(exec`task-A.1 task-B task-C --dry-run`);
		});

		it("should list tasks in order 8", async () => {
			await expectPass(exec`task-B.2 task-A.1 task-B task-C --dry-run`);
		});
	});
});
