import { it, describe } from "vitest";
import { PACKAGE_JSON } from "@nadle/project-resolver";
import { expectPass, withFixture, CONFIG_FILE, PNPM_WORKSPACE, createPackageJson, createNadleConfig, createPnpmWorkspace } from "setup";

describe("workspaces > list", () => {
	it("should list all workspaces", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`--list-workspaces`);
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

	it("should list all nested workspaces", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`--list-workspaces`);
			},
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				[CONFIG_FILE]: createNadleConfig({ configure: { alias: { ".": "projectRoot", "packages/one": "one", "packages/minusOne": "oneMinus" } } }),

				zero: {
					[PACKAGE_JSON]: createPackageJson("zero")
				},
				minusOne: {
					[PACKAGE_JSON]: createPackageJson("minusOne")
				},
				packages: {
					[PACKAGE_JSON]: createPackageJson("packages"),

					one: {
						[PACKAGE_JSON]: createPackageJson("one")
					},
					two: {
						[PACKAGE_JSON]: createPackageJson("two")
					}
				}
			}
		});
	});

	it("should list all nested workspaces 2", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`--list-workspaces`);
			},
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				[CONFIG_FILE]: createNadleConfig({ configure: { alias: { ".": "projectRoot", "packages/one": "one", "packages/minusOne": "oneMinus" } } }),

				zero: {
					[PACKAGE_JSON]: createPackageJson("zero")
				},
				packages: {
					[PACKAGE_JSON]: createPackageJson("packages"),

					two: {
						[PACKAGE_JSON]: createPackageJson("two")
					},
					one: {
						[PACKAGE_JSON]: createPackageJson("one"),
						onAndThird: {
							[PACKAGE_JSON]: createPackageJson("onAndThird")
						},
						oneAndAHalf: {
							[PACKAGE_JSON]: createPackageJson("oneAndAHalf")
						}
					}
				}
			}
		});
	});
});
