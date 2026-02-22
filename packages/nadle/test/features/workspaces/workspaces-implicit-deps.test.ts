import { it, expect, describe } from "vitest";
import { PACKAGE_JSON } from "src/core/utilities/constants.js";
import {
	getStdout,
	getStderr,
	CONFIG_FILE,
	withFixture,
	PNPM_WORKSPACE,
	createNadleConfig,
	createPackageJson,
	createPnpmWorkspace
} from "setup";

describe("workspaces > implicit dependencies", () => {
	describe("linear chain", () => {
		it("should run upstream workspace build before downstream workspace build", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					expect(stdout).toRunInOrder("packages:lib:build", "packages:app:build");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						lib: {
							[PACKAGE_JSON]: createPackageJson("lib"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib" }] })
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] })
						}
					}
				}
			});
		});
	});

	describe("diamond dependency", () => {
		it("should resolve diamond core → [lib-a, lib-b] → app correctly", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					expect(stdout).toRunInOrder("packages:core:build", "packages:lib-a:build");
					expect(stdout).toRunInOrder("packages:core:build", "packages:lib-b:build");
					expect(stdout).toRunInOrder("packages:lib-a:build", "packages:app:build");
					expect(stdout).toRunInOrder("packages:lib-b:build", "packages:app:build");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						core: {
							[PACKAGE_JSON]: createPackageJson("core"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build core" }] })
						},
						"lib-a": {
							[PACKAGE_JSON]: createPackageJson("lib-a", {
								dependencies: { core: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib-a" }] })
						},
						"lib-b": {
							[PACKAGE_JSON]: createPackageJson("lib-b", {
								dependencies: { core: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib-b" }] })
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { "lib-a": "workspace:*", "lib-b": "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] })
						}
					}
				}
			});
		});
	});

	describe("missing upstream task", () => {
		it("should run without error when upstream workspace has no matching task", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					// app:build should run even though lib has no build task
					expect(stdout).toContain("Task packages:app:build DONE");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						lib: {
							[PACKAGE_JSON]: createPackageJson("lib"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "test", log: "Test lib" }] })
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] })
						}
					}
				}
			});
		});
	});

	describe("opt-out", () => {
		it("should not enforce implicit ordering when implicitDependencies is false", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					// Both should run — we just verify no crash and both complete
					expect(stdout).toContain("Task packages:lib:build DONE");
					expect(stdout).toContain("Task packages:app:build DONE");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						configure: { implicitDependencies: false },
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						lib: {
							[PACKAGE_JSON]: createPackageJson("lib"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib" }] })
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] })
						}
					}
				}
			});
		});
	});

	describe("deduplication", () => {
		it("should handle explicit dependsOn and implicit dep to same target", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					expect(stdout).toRunInOrder("packages:lib:build", "packages:app:build");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						lib: {
							[PACKAGE_JSON]: createPackageJson("lib"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib" }] })
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "build", log: "Build app", config: { dependsOn: ["packages:lib:build"] } }]
							})
						}
					}
				}
			});
		});
	});

	describe("devDependencies", () => {
		it("should also create implicit deps from devDependencies", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					expect(stdout).toRunInOrder("packages:lib:build", "packages:app:build");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						lib: {
							[PACKAGE_JSON]: createPackageJson("lib"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib" }] })
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app", {
								devDependencies: { lib: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] })
						}
					}
				}
			});
		});
	});

	describe("root task aggregation", () => {
		it("should run root build after all child workspace builds", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					expect(stdout).toRunInOrder("packages:lib:build", "build");
					expect(stdout).toRunInOrder("packages:app:build", "build");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						lib: {
							[PACKAGE_JSON]: createPackageJson("lib"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib" }] })
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] })
						}
					}
				}
			});
		});

		it("should combine aggregation with implicit workspace deps", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					// lib before app (implicit dep), both before root (aggregation)
					expect(stdout).toRunInOrder("packages:lib:build", "packages:app:build");
					expect(stdout).toRunInOrder("packages:app:build", "build");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						lib: {
							[PACKAGE_JSON]: createPackageJson("lib"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib" }] })
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] })
						}
					}
				}
			});
		});

		it("should not aggregate when implicitDependencies is false", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					// All tasks should complete, root build not forced to wait
					expect(stdout).toContain("Task build DONE");
					expect(stdout).toContain("Task packages:lib:build DONE");
					expect(stdout).toContain("Task packages:app:build DONE");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						configure: { implicitDependencies: false },
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						lib: {
							[PACKAGE_JSON]: createPackageJson("lib"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib" }] })
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app"),
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] })
						}
					}
				}
			});
		});
	});
});
