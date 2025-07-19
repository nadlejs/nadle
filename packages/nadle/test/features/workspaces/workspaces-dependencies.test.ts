import { it, describe } from "vitest";
import { stringify } from "src/core/utilities/stringify.js";
import { PACKAGE_JSON } from "src/core/utilities/constants.js";
import {
	createExec,
	expectPass,
	withFixture,
	CONFIG_FILE,
	PNPM_WORKSPACE,
	createPackageJson,
	createNadleConfig,
	PACKAGE_LOCK_JSON,
	createPnpmWorkspace
} from "setup";

describe("workspaces > dependencies", () => {
	describe("given an npm workspaces project", () => {
		it("should resolve dependencies correctly", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ cwd }) => {
					await expectPass(createExec({ cwd })`--show-config --config-key project.workspaces`);
				},
				files: {
					[CONFIG_FILE]: createNadleConfig(),
					[PACKAGE_LOCK_JSON]: stringify({}),
					[PACKAGE_JSON]: createPackageJson("root", { workspaces: ["packages/*"] }),

					packages: {
						zero: {
							[PACKAGE_JSON]: createPackageJson("zero", { version: "2.3.0-SNAPSHOT" })
						},
						one: {
							[PACKAGE_JSON]: createPackageJson("one", { version: "1.0.0", dependencies: { zero: "2.3.0-SNAPSHOT" } })
						},
						two: {
							[PACKAGE_JSON]: createPackageJson("two", { version: "SNAPSHOT", devDependencies: { zero: "*" }, dependencies: { one: "~1.0.0" } })
						},
						three: {
							[PACKAGE_JSON]: createPackageJson("three", {
								dependencies: {
									one: "^1.0.0",
									two: "SNAPSHOT"
								}
							})
						}
					}
				}
			});
		});
	});

	describe("given a pnpm workspaces project", () => {
		it("should resolve dependencies correctly", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ cwd }) => {
					await expectPass(createExec({ cwd })`--show-config --config-key project.workspaces`);
				},
				files: {
					[CONFIG_FILE]: createNadleConfig(),
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),

					packages: {
						zero: {
							[PACKAGE_JSON]: createPackageJson("zero", { version: "2.3.0-SNAPSHOT" })
						},
						one: {
							[PACKAGE_JSON]: createPackageJson("one", { version: "1.0.0", dependencies: { zero: "workspace:~" } })
						},
						two: {
							[PACKAGE_JSON]: createPackageJson("two", {
								version: "SNAPSHOT",
								dependencies: { one: "workspace:^" },
								devDependencies: { zero: "workspace:*" }
							})
						}
					}
				}
			});
		});
	});

	describe("given a yarn workspaces project", () => {
		it("should resolve dependencies correctly", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ cwd }) => {
					await expectPass(createExec({ cwd })`--show-config --config-key project.workspaces`);
				},
				files: {
					"yarn.lock": "",
					[CONFIG_FILE]: createNadleConfig(),
					[PACKAGE_JSON]: createPackageJson("root", { workspaces: ["./packages/*"] }),

					packages: {
						zero: {
							[PACKAGE_JSON]: createPackageJson("zero", { version: "2.3.0-SNAPSHOT" })
						},
						one: {
							[PACKAGE_JSON]: createPackageJson("one", { version: "1.0.0", dependencies: { zero: "workspace:~" } })
						},
						two: {
							[PACKAGE_JSON]: createPackageJson("two", {
								version: "SNAPSHOT",
								dependencies: { one: "workspace:^" },
								devDependencies: { zero: "workspace:*" }
							})
						}
					}
				}
			});
		});
	});
});
