import { it, describe } from "vitest";
import { PACKAGE_JSON } from "src/core/utilities/constants.js";
import { expectPass, withFixture, CONFIG_FILE, PNPM_WORKSPACE, createPackageJson, createPnpmWorkspace } from "setup";

describe("workspaces detection", () => {
	// TODO: Error!!
	it.todo("single workspace in monorepo");

	it("one package", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`--show-config --config-key project`);
			},
			files: {
				[CONFIG_FILE]: "",
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				one: {
					[PACKAGE_JSON]: createPackageJson("one")
				}
			}
		});
	});

	it("multiple packages", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`--show-config --config-key project`);
			},
			files: {
				[CONFIG_FILE]: "",
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				app: { [PACKAGE_JSON]: createPackageJson("app") },
				common: {
					api: { [PACKAGE_JSON]: createPackageJson("api") },
					types: { [PACKAGE_JSON]: createPackageJson("types") }
				}
			}
		});
	});

	it("multiple packages with ignore packages", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`--show-config --config-key project`);
			},
			files: {
				[CONFIG_FILE]: "",
				[PACKAGE_JSON]: createPackageJson("root"),
				[PNPM_WORKSPACE]: createPnpmWorkspace(["./**", "!./common/types"]),

				app: { [PACKAGE_JSON]: createPackageJson("app") },
				common: {
					api: { [PACKAGE_JSON]: createPackageJson("api") },
					types: { [PACKAGE_JSON]: createPackageJson("types") }
				}
			}
		});
	});

	it("multiple packages with config files", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`--show-config --config-key project`);
			},
			files: {
				[CONFIG_FILE]: "",
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),

				app: { [CONFIG_FILE]: "", [PACKAGE_JSON]: createPackageJson("app") },
				common: {
					types: { [PACKAGE_JSON]: createPackageJson("types") },
					api: { "nadle.config.js": "", [PACKAGE_JSON]: createPackageJson("api") }
				}
			}
		});
	});

	it("multiple packages with custom config file", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`--config config/nadle.config.js --show-config --config-key project`);
			},
			files: {
				[CONFIG_FILE]: "",
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),

				config: {
					"nadle.config.js": ""
				},

				app: { [CONFIG_FILE]: "", [PACKAGE_JSON]: createPackageJson("app") }
			}
		});
	});
});
