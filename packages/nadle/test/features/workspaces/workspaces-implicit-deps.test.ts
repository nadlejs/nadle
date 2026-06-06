import { it, expect, describe } from "vitest";
import { getStdout, getStderr, withFixture, workspaceFixture } from "setup";

describe("workspaces > implicit dependencies", () => {
	describe("linear chain", () => {
		it("should run upstream workspace build before downstream workspace build", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					expect(stdout).toRunInOrder("packages:lib:build", "packages:app:build");
				},
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/lib": { tasks: [{ name: "build" }] },
						"packages/app": { tasks: [{ name: "build" }], pkg: { dependencies: { lib: "workspace:*" } } }
					}
				})
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
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/core": { tasks: [{ name: "build" }] },
						"packages/lib-a": { tasks: [{ name: "build" }], pkg: { dependencies: { core: "workspace:*" } } },
						"packages/lib-b": { tasks: [{ name: "build" }], pkg: { dependencies: { core: "workspace:*" } } },
						"packages/app": { tasks: [{ name: "build" }], pkg: { dependencies: { "lib-a": "workspace:*", "lib-b": "workspace:*" } } }
					}
				})
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
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/lib": { tasks: [{ name: "test" }] },
						"packages/app": { tasks: [{ name: "build" }], pkg: { dependencies: { lib: "workspace:*" } } }
					}
				})
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
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }], configure: { implicitDependencies: false } },
					workspaces: {
						"packages/lib": { tasks: [{ name: "build" }] },
						"packages/app": { tasks: [{ name: "build" }], pkg: { dependencies: { lib: "workspace:*" } } }
					}
				})
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
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/lib": { tasks: [{ name: "build" }] },
						"packages/app": {
							pkg: { dependencies: { lib: "workspace:*" } },
							tasks: [{ name: "build", config: { dependsOn: ["packages:lib:build"] } }]
						}
					}
				})
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
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/lib": { tasks: [{ name: "build" }] },
						"packages/app": { tasks: [{ name: "build" }], pkg: { devDependencies: { lib: "workspace:*" } } }
					}
				})
			});
		});
	});

	describe("root task aggregation", () => {
		it("should run root build after all child workspace builds", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/lib": { tasks: [{ name: "build" }] },
						"packages/app": { tasks: [{ name: "build" }] }
					}
				}),
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					expect(stdout).toRunInOrder("packages:lib:build", "build");
					expect(stdout).toRunInOrder("packages:app:build", "build");
				}
			});
		});

		it("should combine aggregation with implicit workspace deps", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/lib": { tasks: [{ name: "build" }] },
						"packages/app": { tasks: [{ name: "build" }], pkg: { dependencies: { lib: "workspace:*" } } }
					}
				}),
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					// lib before app (implicit dep), both before root (aggregation)
					expect(stdout).toRunInOrder("packages:lib:build", "packages:app:build");
					expect(stdout).toRunInOrder("packages:app:build", "build");
				}
			});
		});

		it("should not aggregate when implicitDependencies is false", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }], configure: { implicitDependencies: false } },
					workspaces: {
						"packages/lib": { tasks: [{ name: "build" }] },
						"packages/app": { tasks: [{ name: "build" }] }
					}
				}),
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					// All tasks should complete, root build not forced to wait
					expect(stdout).toContain("Task build DONE");
					expect(stdout).toContain("Task packages:lib:build DONE");
					expect(stdout).toContain("Task packages:app:build DONE");
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
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/a": { tasks: [{ name: "build" }], pkg: { dependencies: { b: "workspace:*" } } },
						"packages/b": { tasks: [{ name: "build" }], pkg: { dependencies: { a: "workspace:*" } } }
					}
				})
			});
		});

		it("should not cycle when only one workspace has the task", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel`);

					expect(stdout).toContain("Task packages:a:build DONE");
				},
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/b": { tasks: [{ name: "test" }], pkg: { dependencies: { a: "workspace:*" } } },
						"packages/a": { tasks: [{ name: "build" }], pkg: { dependencies: { b: "workspace:*" } } }
					}
				})
			});
		});

		it("should show workspace-qualified names in cycle error", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/a": { tasks: [{ name: "build" }], pkg: { dependencies: { b: "workspace:*" } } },
						"packages/b": { tasks: [{ name: "build" }], pkg: { dependencies: { a: "workspace:*" } } }
					}
				}),
				testFn: async ({ exec }) => {
					const stderr = await getStderr(exec`build --parallel`);

					expect(stderr).toContain("Cycle detected");
					// Error message should include fully qualified workspace:task names
					expect(stderr).toMatch(/packages:a:build.*packages:b:build|packages:b:build.*packages:a:build/);
				}
			});
		});
	});

	describe("dry-run visibility", () => {
		it("should show implicit dependency annotation in dry-run output", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/lib": { tasks: [{ name: "build" }] },
						"packages/app": { tasks: [{ name: "build" }], pkg: { dependencies: { lib: "workspace:*" } } }
					}
				}),
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel --dry-run`);

					expect(stdout).toContain("Execution plan");
					// app:build should show implicit dep on lib:build
					expect(stdout).toMatch(/packages:app:build.*implicit/);
				}
			});
		});

		it("should not show implicit annotation for explicit deps", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				files: workspaceFixture({
					root: { tasks: [{ name: "build" }] },
					workspaces: {
						"packages/lib": { tasks: [{ name: "build" }] },
						"packages/app": { tasks: [{ name: "build" }], pkg: { dependencies: { lib: "workspace:*" } } }
					}
				}),
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --parallel --dry-run`);

					expect(stdout).toContain("Execution plan");
					// lib:build line itself should not have implicit annotation
					expect(stdout).toMatch(/Task packages:lib:build\s*$/m);
				}
			});
		});
	});
});
