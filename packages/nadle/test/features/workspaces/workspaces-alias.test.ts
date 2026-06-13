import { it, describe } from "vitest";
import { expectPass, withFixture, workspaceFixture } from "setup";

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

	// TODO(#416): assert alias validation rejects invalid configs — duplicate
	// aliases mapping to different workspaces, an alias colliding with a real
	// workspace id, and an alias for a non-existent path should each error.
	it.todo("rejects invalid alias configuration");
});
