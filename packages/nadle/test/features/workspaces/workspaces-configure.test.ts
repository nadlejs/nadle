import { it, expect, describe } from "vitest";
import { PACKAGE_JSON } from "src/core/utilities/constants.js";
import { getStderr, withFixture, CONFIG_FILE, PNPM_WORKSPACE, createPackageJson, createNadleConfig, createPnpmWorkspace } from "setup";

describe("workspaces configure", () => {
	describe("when calling configure from sub-workspace configure file", () => {
		it("should throw an error", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					await expect(getStderr(exec`build`)).resolves.toContain(`configure function can only be called from the root workspace.`);
				},
				files: {
					[PNPM_WORKSPACE]: createPnpmWorkspace(),
					[PACKAGE_JSON]: createPackageJson("root"),
					[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build root" }], configure: { alias: { "packages/one": "one" } } }),

					packages: {
						two: {
							[PACKAGE_JSON]: createPackageJson("two"),
							[CONFIG_FILE]: createNadleConfig({ configure: { maxWorkers: 3 } })
						}
					}
				}
			});
		});
	});
});
