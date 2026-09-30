import { it, expect, describe } from "vitest";
import { getStderr, expectPass, withFixture, workspaceFixture } from "setup";

describe("workspaces alias", () => {
	it("object style", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`build`);
			},
			files: workspaceFixture({
				root: { tasks: [{ name: "build" }], configure: { alias: { "packages/one": "one" } } },
				workspaces: {
					"packages/one": { tasks: [{ name: "build" }] },
					"packages/two": { tasks: [{ name: "build" }] }
				}
			})
		});
	});

	it("function style", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`build`);
			},
			files: workspaceFixture({
				workspaces: {
					"packages/one": { tasks: [{ name: "build" }] },
					"packages/two": { tasks: [{ name: "build" }] }
				},
				root: {
					tasks: [{ name: "build" }],
					configure: {
						alias: (workspacePath) => {
							if (workspacePath.endsWith("o")) {
								return "two";
							}
						}
					}
				}
			})
		});
	});

	it("root alias", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`build`);
			},
			files: workspaceFixture({
				workspaces: {
					"packages/one": { tasks: [{ name: "build" }] }
				},
				root: { tasks: [{ name: "build" }], configure: { alias: { ".": "my-root" } } }
			})
		});
	});

	it("rejects an alias key that matches no workspace", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expect(getStderr(exec`build`)).resolves.toContain(`Alias key "packages/nope" does not match any workspace`);
			},
			files: workspaceFixture({
				workspaces: {
					"packages/one": { tasks: [{ name: "build" }] }
				},
				root: { tasks: [{ name: "build" }], configure: { alias: { "packages/nope": "nope" } } }
			})
		});
	});

	it("rejects duplicate aliases mapping to the same label", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expect(getStderr(exec`build`)).resolves.toContain(`conflicts with workspace`);
			},
			files: workspaceFixture({
				root: { tasks: [{ name: "build" }], configure: { alias: { "packages/one": "dup", "packages/two": "dup" } } },
				workspaces: {
					"packages/one": { tasks: [{ name: "build" }] },
					"packages/two": { tasks: [{ name: "build" }] }
				}
			})
		});
	});

	it("rejects an alias that collides with a real workspace id", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				// `packages:two` is another workspace's id; aliasing `packages/one` to it is rejected.
				await expect(getStderr(exec`build`)).resolves.toContain(`conflicts with`);
			},
			files: workspaceFixture({
				root: { tasks: [{ name: "build" }], configure: { alias: { "packages/one": "packages:two" } } },
				workspaces: {
					"packages/one": { tasks: [{ name: "build" }] },
					"packages/two": { tasks: [{ name: "build" }] }
				}
			})
		});
	});
});
