import Path from "node:path";

import { it, expect, describe } from "vitest";
import { getStderr, getStdout, createExec, withFixture, workspaceFixture } from "setup";

describe.concurrent("workspaces > depends on tasks", () => {
	describe("when declare a task without workspace", () => {
		describe("when the declared task is not defined in the workspace", () => {
			it("should throw an error even if having a same task in root workspace", async () => {
				await withFixture({
					fixtureDir: "monorepo",
					files: workspaceFixture({
						root: { tasks: [{ name: "build" }] },
						workspaces: {
							"packages/one": { tasks: [{ name: "check", config: { dependsOn: ["build"] } }] }
						}
					}),
					testFn: async ({ cwd }) => {
						// TODO: Should we enable --stacktrace by default?
						await expect(getStderr(createExec({ cwd: Path.join(cwd, "packages", "one") })`check --stacktrace`)).resolves.toContain(
							`Task build not found in packages:one workspace.`
						);
					}
				});
			});
		});

		describe("when the declared task is defined in the workspace but having a typo in dependsOn", () => {
			it("should throw an error instead of trying to correct it", async () => {
				await withFixture({
					fixtureDir: "monorepo",
					files: workspaceFixture({
						root: { tasks: [{ name: "build" }] },
						workspaces: {
							"packages/one": { tasks: [{ name: "build" }, { name: "check", config: { dependsOn: ["buidl"] } }] }
						}
					}),
					testFn: async ({ cwd }) => {
						await expect(getStderr(createExec({ cwd: Path.join(cwd, "packages", "one") })`check --stacktrace`)).resolves.toContain(
							`Task buidl not found in packages:one workspace.`
						);
					}
				});
			});
		});

		describe("when the declared task is defined in the workspace", () => {
			it("should run the declared task first", async () => {
				await withFixture({
					fixtureDir: "monorepo",
					files: workspaceFixture({
						root: { tasks: [{ name: "build" }] },
						workspaces: {
							"packages/one": { tasks: [{ name: "build" }, { name: "check", config: { dependsOn: ["build"] } }] }
						}
					}),
					testFn: async ({ cwd }) => {
						const stdout = await getStdout(createExec({ cwd: Path.join(cwd, "packages", "one") })`check`);

						expect(stdout).toRunInOrder("packages:one:build", "packages:one:check");
					}
				});
			});
		});
	});

	describe("when declare a task with workspace", () => {
		describe("when the workspace and task are found", () => {
			it("should resolve correctly even with alias", async () => {
				await withFixture({
					fixtureDir: "monorepo",
					testFn: async ({ cwd }) => {
						const stdout = await getStdout(createExec({ cwd: Path.join(cwd, "packages", "one") })`build`);

						expect(stdout).toRunInOrder("two:build", "packages:one:build");
						expect(stdout).toRunInOrder("two:check", "packages:one:build");
						expect(stdout).toRunInOrder("packages:one:check", "packages:one:build");
						expect(stdout).toRunInOrder("build", "packages:one:build");
					},
					files: workspaceFixture({
						root: { tasks: [{ name: "build" }], configure: { alias: { "packages/two": "two" } } },
						workspaces: {
							"packages/two": { tasks: [{ name: "build" }, { name: "check" }] },
							"packages/one": {
								tasks: [
									{ name: "check" },
									{
										name: "build",
										config: { dependsOn: ["packages:two:build", "two:check", "check", "root:build"] }
									}
								]
							}
						}
					})
				});
			});
		});

		describe("when the workspace or task is found", () => {
			const testCases = [
				{
					dependency: ["packages:three:build"],
					expectation: "should throw error when the workspace is not found",
					expectedError: 'Workspace "packages:three" not found. Available workspaces: root, packages:one, packages:two'
				},
				{
					dependency: ["packages:two:check"],
					expectedError: "Task check not found in packages:two workspace.",
					expectation: "should throw error when the workspace is found but the task is not"
				}
			];

			for (const { dependency, expectation, expectedError } of testCases) {
				it(`${expectation}`, async () => {
					await withFixture({
						fixtureDir: "monorepo",
						testFn: async ({ cwd }) => {
							await expect(getStderr(createExec({ cwd: Path.join(cwd, "packages", "one") })`build --stacktrace`)).resolves.toContain(expectedError);
						},
						files: workspaceFixture({
							root: { tasks: [{ name: "build" }] },
							workspaces: {
								"packages/two": { tasks: [{ name: "build" }] },
								"packages/one": { tasks: [{ name: "build", config: { dependsOn: dependency } }] }
							}
						})
					});
				});
			}
		});
	});
});
