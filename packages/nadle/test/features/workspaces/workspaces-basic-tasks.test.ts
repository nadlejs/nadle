import Path from "node:path";

import type fixturify from "fixturify";
import { it, expect, describe } from "vitest";
import { getStderr, createExec, expectPass, withFixture, workspaceFixture } from "setup";

describe("workspaces basic tasks", () => {
	const project: fixturify.DirJSON = workspaceFixture({
		root: { tasks: [{ name: "build" }, { name: "test" }] },
		workspaces: {
			"packages/one": { tasks: [{ name: "build" }] },
			"packages/two": { tasks: [{ name: "build" }] },
			"packages/three": { tasks: [{ name: "build" }] }
		}
	});

	it("should register all tasks from all config files", async () => {
		await withFixture({
			files: project,
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`--list`);
			}
		});
	});

	describe("when specifying sub-workspace tasks", () => {
		it("should run those tasks only", async () => {
			await withFixture({
				files: project,
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					await expectPass(exec`packages:two:build packages:one:build`);
				}
			});
		});
	});

	describe("when specifying root task", () => {
		it("should run that task first then all sub-workspace task with the same name", async () => {
			await withFixture({
				files: project,
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					await expectPass(exec`build`);
				}
			});
		});
	});

	describe("when specifying a workspace task then the root task with the same name", () => {
		it("should run the workspace task first, then the root and and finally other workspace tasks with the same name", async () => {
			await withFixture({
				files: project,
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					await expectPass(exec`packages:two:build build`);
				}
			});
		});
	});

	describe("when running a task from a workspace", () => {
		describe("with specifying workspace explicitly", () => {
			describe("when the task is defined in the workspace", () => {
				it("should run the that task", async () => {
					await withFixture({
						files: project,
						fixtureDir: "monorepo",
						testFn: async ({ cwd }) => {
							const exec = createExec({ cwd: Path.join(cwd, "packages", "one") });

							await expectPass(exec`packages:two:build`);
							await expectPass(exec`root:build`);
						}
					});
				});

				describe("when the task is not defined in the workspace", () => {
					it("should throw error instead of trying to run the root one", async () => {
						await withFixture({
							files: project,
							fixtureDir: "monorepo",
							testFn: async ({ cwd }) => {
								await expect(getStderr(createExec({ cwd: Path.join(cwd, "packages", "one") })`packages:two:test`)).resolves.toContain(
									`Task test not found in packages:two workspace.`
								);
							}
						});
					});
				});
			});
		});

		describe("without specifying the workspace", () => {
			describe("when the task is defined in the workspace", () => {
				it("should run that task", async () => {
					await withFixture({
						files: project,
						fixtureDir: "monorepo",
						testFn: async ({ cwd }) => {
							await expectPass(createExec({ cwd: Path.join(cwd, "packages", "one") })`build`);
						}
					});
				});
			});

			describe("when the task is not defined in the workspace", () => {
				it("should run the root task if defined", async () => {
					await withFixture({
						files: project,
						fixtureDir: "monorepo",
						testFn: async ({ cwd }) => {
							await expectPass(createExec({ cwd: Path.join(cwd, "packages", "one") })`test`);
						}
					});
				});

				it("should throw error if the root task is not defined neither", async () => {
					await withFixture({
						files: project,
						fixtureDir: "monorepo",
						testFn: async ({ cwd }) => {
							await expect(getStderr(createExec({ cwd: Path.join(cwd, "packages", "one") })`check`)).resolves.toContain(
								`Task check not found in packages:one nor root workspace`
							);
						}
					});
				});
			});
		});
	});
});
