import Path from "node:path";

import { it, expect, describe } from "vitest";
import { PACKAGE_JSON } from "src/core/utilities/constants.js";
import {
	getStderr,
	getStdout,
	createExec,
	CONFIG_FILE,
	withFixture,
	PNPM_WORKSPACE,
	createNadleConfig,
	createPackageJson,
	createPnpmWorkspace
} from "setup";

describe("workspaces > depends on tasks", () => {
	describe("when declare a task without workspace", () => {
		describe("when the declared task is not defined in the workspace", () => {
			it("should throw an error even if having a same task in root workspace", async () => {
				await withFixture({
					fixtureDir: "monorepo",
					testFn: async ({ cwd }) => {
						// TODO: Should we enable --stacktrace by default?
						await expect(getStderr(createExec({ cwd: Path.join(cwd, "packages", "one") })`check --stacktrace`)).resolves.toContain(
							`Task build not found in packages:one workspace.`
						);
					},
					files: {
						[PNPM_WORKSPACE]: createPnpmWorkspace(),
						[PACKAGE_JSON]: createPackageJson("root"),
						[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build root" }] }),

						packages: {
							one: {
								[PACKAGE_JSON]: createPackageJson("one"),
								[CONFIG_FILE]: createNadleConfig({
									tasks: [{ name: "check", log: "Check one", config: { dependsOn: ["build"] } }]
								})
							}
						}
					}
				});
			});
		});

		describe("when the declared task is defined in the workspace but having a typo in dependsOn", () => {
			it("should throw an error instead of trying to correct it", async () => {
				await withFixture({
					fixtureDir: "monorepo",
					testFn: async ({ cwd }) => {
						await expect(getStderr(createExec({ cwd: Path.join(cwd, "packages", "one") })`check --stacktrace`)).resolves.toContain(
							`Task buidl not found in packages:one workspace.`
						);
					},
					files: {
						[PNPM_WORKSPACE]: createPnpmWorkspace(),
						[PACKAGE_JSON]: createPackageJson("root"),
						[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build root" }] }),

						packages: {
							one: {
								[PACKAGE_JSON]: createPackageJson("one"),
								[CONFIG_FILE]: createNadleConfig({
									tasks: [
										{ name: "build", log: "Build one" },
										{ name: "check", log: "Check one", config: { dependsOn: ["buidl"] } }
									]
								})
							}
						}
					}
				});
			});
		});

		describe("when the declared task is defined in the workspace", () => {
			it("should run the declared task first", async () => {
				await withFixture({
					fixtureDir: "monorepo",
					testFn: async ({ cwd }) => {
						const stdout = await getStdout(createExec({ cwd: Path.join(cwd, "packages", "one") })`check`);

						expect(stdout).toRunInOrder("packages:one:build", "packages:one:check");
					},
					files: {
						[PNPM_WORKSPACE]: createPnpmWorkspace(),
						[PACKAGE_JSON]: createPackageJson("root"),
						[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build root" }] }),

						packages: {
							one: {
								[PACKAGE_JSON]: createPackageJson("one"),
								[CONFIG_FILE]: createNadleConfig({
									tasks: [
										{ name: "build", log: "Build one" },
										{ name: "check", log: "Check one", config: { dependsOn: ["build"] } }
									]
								})
							}
						}
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
					files: {
						[PNPM_WORKSPACE]: createPnpmWorkspace(),
						[PACKAGE_JSON]: createPackageJson("root"),
						[CONFIG_FILE]: createNadleConfig({
							tasks: [{ name: "build", log: "Build root" }],
							configure: { alias: { "packages/two": "two" } }
						}),

						packages: {
							two: {
								[PACKAGE_JSON]: createPackageJson("two"),
								[CONFIG_FILE]: createNadleConfig({
									tasks: [
										{ name: "build", log: "Build two" },
										{ name: "check", log: "Check two" }
									]
								})
							},
							one: {
								[PACKAGE_JSON]: createPackageJson("one"),
								[CONFIG_FILE]: createNadleConfig({
									tasks: [
										{ name: "check", log: "Check two" },
										{
											name: "build",
											log: "Build one",
											config: { dependsOn: ["packages:two:build", "two:check", "check", "root:build"] }
										}
									]
								})
							}
						}
					}
				});
			});
		});

		describe("when the workspace or task is found", () => {
			const testCases = [
				{
					dependency: ["packages:three:build"],
					expectation: "should throw error when the workspace is not found",
					expectedError: "Workspace packages:three not found. Available workspaces: root, packages:one, packages:two."
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
						files: {
							[PNPM_WORKSPACE]: createPnpmWorkspace(),
							[PACKAGE_JSON]: createPackageJson("root"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build root" }] }),

							packages: {
								two: {
									[PACKAGE_JSON]: createPackageJson("two"),
									[CONFIG_FILE]: createNadleConfig({
										tasks: [{ name: "build", log: "Build two" }]
									})
								},
								one: {
									[PACKAGE_JSON]: createPackageJson("one"),
									[CONFIG_FILE]: createNadleConfig({
										tasks: [{ name: "build", log: "Build one", config: { dependsOn: dependency } }]
									})
								}
							}
						}
					});
				});
			}
		});
	});
});
