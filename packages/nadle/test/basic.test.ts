import { it, expect, describe } from "vitest";
import { config, fixture, getStdout, readConfig, withGeneratedFixture } from "setup";

const basicFiles = fixture()
	.packageJson("basic")
	.configRaw(await readConfig("basic.ts"))
	.build();

const abcFiles = fixture()
	.packageJson("abc")
	.config(
		config()
			.task("task-A-0")
			.task("task-A-1")
			.task("task-A-2")
			.taskWithConfig("task-A", { dependsOn: ["task-A-0", "task-A-1", "task-A-2"] })
			.task("task-B-0")
			.task("task-B-1")
			.task("task-B-2")
			.taskWithConfig("task-B", { dependsOn: ["task-B-0", "task-B-1", "task-B-2"] })
			.task("task-C-0")
			.task("task-C-1")
			.task("task-C-2")
			.taskWithConfig("task-C", {
				dependsOn: ["task-A", "task-B", "task-C-0", "task-C-1", "task-C-2"]
			})
	)
	.build();

describe("basic", () => {
	describe("single command", () => {
		it("can run a simple command 1", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`node`)).resolves.toRunInOrder("node");
				}
			}));

		it("can run a simple command 2", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`install`)).resolves.toRunInOrder("node", "install");
				}
			}));

		it("can run a simple command 3", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`compile`)).resolves.toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
				}
			}));

		it("can run a simple command 4", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`test`)).resolves.toRunInOrder("node", "install", "test");
				}
			}));
	});

	describe("multiple commands", () => {
		it("should run in order 1", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`test compileTs`);

					expect(stdout).toRunInOrder("node", "install", "compileTs");
					expect(stdout).toRunInOrder("node", "install", "test");
					expect(stdout).toRunInOrder("test", "compileTs");
				}
			}));

		it("should run in order 2", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`test compile`);

					expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
					expect(stdout).toRunInOrder("node", "install", "test");
					expect(stdout).toRunInOrder("test", "compile");
				}
			}));

		it("should run in order 3", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`compileTs test`);

					expect(stdout).toRunInOrder("node", "install", "compileTs");
					expect(stdout).toRunInOrder("node", "install", "test");
					expect(stdout).toRunInOrder("compileTs", "test");
				}
			}));

		it("should run in order 4", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`compile test`);

					expect(stdout).toRunInOrder("node", "install", ["compileSvg", "compileTs"], "compile");
					expect(stdout).toRunInOrder("node", "install", "test");
					expect(stdout).toRunInOrder("compile", "test");
				}
			}));

		it("should run in order 5", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`node install`)).resolves.toRunInOrder("node", "install");
				}
			}));

		it("should run in order 6", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`install node`)).resolves.toRunInOrder("node", "install");
				}
			}));

		it("should run in order 7", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`slow fast`)).resolves.toRunInOrder("slow", "fast");
				}
			}));

		it("should run in order 8", () =>
			withGeneratedFixture({
				files: basicFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`fast slow`)).resolves.toRunInOrder("fast", "slow");
				}
			}));
	});

	describe("with --dry-run", () => {
		it("should list tasks in order 1", () =>
			withGeneratedFixture({
				files: abcFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`task-A task-B --dry-run`)).resolves.toContain("RUN SUCCESSFUL");
				}
			}));

		it("should list tasks in order 2", () =>
			withGeneratedFixture({
				files: abcFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`task-B task-A --dry-run`)).resolves.toContain("RUN SUCCESSFUL");
				}
			}));

		it("should list tasks in order 3", () =>
			withGeneratedFixture({
				files: abcFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`task-B task-A-2 task-A --dry-run`)).resolves.toContain("RUN SUCCESSFUL");
				}
			}));

		it("should list tasks in order 4", () =>
			withGeneratedFixture({
				files: abcFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`task-A-1 task-A-0 task-A-2 task-A --dry-run`)).resolves.toContain("RUN SUCCESSFUL");
				}
			}));

		it("should list tasks in order 5", () =>
			withGeneratedFixture({
				files: abcFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`task-C task-A --dry-run`)).resolves.toContain("RUN SUCCESSFUL");
				}
			}));

		it("should list tasks in order 6", () =>
			withGeneratedFixture({
				files: abcFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`task-B task-C --dry-run`)).resolves.toContain("RUN SUCCESSFUL");
				}
			}));

		it("should list tasks in order 7", () =>
			withGeneratedFixture({
				files: abcFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`task-A-1 task-B task-C --dry-run`)).resolves.toContain("RUN SUCCESSFUL");
				}
			}));

		it("should list tasks in order 8", () =>
			withGeneratedFixture({
				files: abcFiles,
				testFn: async ({ exec }) => {
					await expect(getStdout(exec`task-B-2 task-A-1 task-B task-C --dry-run`)).resolves.toContain("RUN SUCCESSFUL");
				}
			}));
	});
});
