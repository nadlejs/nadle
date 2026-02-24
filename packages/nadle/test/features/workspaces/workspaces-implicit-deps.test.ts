import { it, expect, describe } from "vitest";
import { PACKAGE_JSON } from "@nadle/project-resolver";
import { getStdout, getStderr, CONFIG_FILE, withFixture, PNPM_WORKSPACE, createNadleConfig, createPackageJson, createPnpmWorkspace } from "setup";

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
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] }),
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							})
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
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib-a" }] }),
							[PACKAGE_JSON]: createPackageJson("lib-a", {
								dependencies: { core: "workspace:*" }
							})
						},
						"lib-b": {
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build lib-b" }] }),
							[PACKAGE_JSON]: createPackageJson("lib-b", {
								dependencies: { core: "workspace:*" }
							})
						},
						app: {
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] }),
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { "lib-a": "workspace:*", "lib-b": "workspace:*" }
							})
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
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] }),
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							})
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
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] }),
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							})
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
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] }),
							[PACKAGE_JSON]: createPackageJson("app", {
								devDependencies: { lib: "workspace:*" }
							})
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
							[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build app" }] }),
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							})
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

	describe("cycle detection with implicit deps", () => {
		it("should detect cycle from circular workspace deps", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stderr = await getStderr(exec`build --parallel`);

					expect(stderr).toContain("Cycle detected");
					expect(stderr).toContain("packages:a:build");
					expect(stderr).toContain("packages:b:build");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						a: {
							[PACKAGE_JSON]: createPackageJson("a", {
								dependencies: { b: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "build", log: "Build a" }]
							})
						},
						b: {
							[PACKAGE_JSON]: createPackageJson("b", {
								dependencies: { a: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "build", log: "Build b" }]
							})
						}
					}
				}
			});
		});

		it("should not cycle when only one workspace has the task", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					expect(stdout).toContain("Task packages:a:build DONE");
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						b: {
							[PACKAGE_JSON]: createPackageJson("b", {
								dependencies: { a: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "test", log: "Test b" }]
							})
						},
						a: {
							[PACKAGE_JSON]: createPackageJson("a", {
								dependencies: { b: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "build", log: "Build a" }]
							})
						}
					}
				}
			});
		});

		it("should show workspace-qualified names in cycle error", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stderr = await getStderr(exec`build --parallel`);

					expect(stderr).toContain("Cycle detected");
					// Error message should include fully qualified workspace:task names
					expect(stderr).toMatch(/packages:a:build.*packages:b:build|packages:b:build.*packages:a:build/);
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({
						tasks: [{ name: "build", log: "Build root" }]
					}),

					packages: {
						a: {
							[PACKAGE_JSON]: createPackageJson("a", {
								dependencies: { b: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "build", log: "Build a" }]
							})
						},
						b: {
							[PACKAGE_JSON]: createPackageJson("b", {
								dependencies: { a: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "build", log: "Build b" }]
							})
						}
					}
				}
			});
		});
	});

	describe("dry-run visibility", () => {
		it("should show implicit dependency annotation in dry-run output", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel --dry-run`);

					expect(stdout).toContain("Execution plan");
					// app:build should show implicit dep on lib:build
					expect(stdout).toMatch(/packages:app:build.*implicit/);
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
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "build", log: "Build lib" }]
							})
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "build", log: "Build app" }]
							})
						}
					}
				}
			});
		});

		it("should not show implicit annotation for explicit deps", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel --dry-run`);

					expect(stdout).toContain("Execution plan");
					// lib:build line itself should not have implicit annotation
					expect(stdout).toMatch(/Task packages:lib:build\s*$/m);
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
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "build", log: "Build lib" }]
							})
						},
						app: {
							[PACKAGE_JSON]: createPackageJson("app", {
								dependencies: { lib: "workspace:*" }
							}),
							[CONFIG_FILE]: createNadleConfig({
								tasks: [{ name: "build", log: "Build app" }]
							})
						}
					}
				}
			});
		});
	});
});
