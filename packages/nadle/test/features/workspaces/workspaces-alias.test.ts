import { it, describe } from "vitest";
import { PACKAGE_JSON } from "src/core/utilities/constants.js";
import { expectPass, withFixture, CONFIG_FILE, PNPM_WORKSPACE, createPackageJson, createNadleConfig, createPnpmWorkspace } from "setup";

describe("workspaces alias", () => {
	it("object style", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`build`);
			},
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build root" }], configure: { alias: { "packages/one": "one" } } }),

				packages: {
					one: {
						[PACKAGE_JSON]: createPackageJson("one"),
						[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build one" }] })
					},
					two: {
						[PACKAGE_JSON]: createPackageJson("two"),
						[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build two" }] })
					}
				}
			}
		});
	});

	it("function style", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`build`);
			},
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				[CONFIG_FILE]: createNadleConfig({
					tasks: [{ name: "build", log: "Build root" }],
					configure: {
						alias: (workspacePath) => {
							if (workspacePath.endsWith("o")) {
								return "two";
							}
						}
					}
				}),

				packages: {
					one: {
						[PACKAGE_JSON]: createPackageJson("one"),
						[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build one" }] })
					},
					two: {
						[PACKAGE_JSON]: createPackageJson("two"),
						[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build two" }] })
					}
				}
			}
		});
	});

	it("root alias", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`build`);
			},
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				[CONFIG_FILE]: createNadleConfig({
					tasks: [{ name: "build", log: "Build root" }],
					configure: {
						alias: { ".": "my-root" }
					}
				}),

				packages: {
					one: {
						[PACKAGE_JSON]: createPackageJson("one"),
						[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build one" }] })
					}
				}
			}
		});
	});

	it.todo("Validate");
});
