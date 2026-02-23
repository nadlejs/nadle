import Path from "node:path";

import { it, describe } from "vitest";
import { PACKAGE_JSON } from "@nadle/project";
import { createExec, expectPass, CONFIG_FILE, withFixture, PNPM_WORKSPACE, createNadleConfig, createPackageJson, createPnpmWorkspace } from "setup";

describe("workspaces > excluded tasks", () => {
	it("should not run excluded tasks", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ cwd }) => {
				const exec = createExec({ cwd: Path.join(cwd, "packages", "one") });

				await expectPass(exec`check --exclude build`);
				await expectPass(exec`check --exclude two:build`);
				await expectPass(exec`check --exclude packages:two:build`);
			},
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build", log: "Build root" }], configure: { alias: { "packages/two": "two" } } }),

				packages: {
					two: {
						[PACKAGE_JSON]: createPackageJson("one"),
						[CONFIG_FILE]: createNadleConfig({
							tasks: [
								{ name: "build", log: "Build one" },
								{ name: "check", log: "Check one", config: { dependsOn: ["build"] } }
							]
						})
					},
					one: {
						[PACKAGE_JSON]: createPackageJson("one"),
						[CONFIG_FILE]: createNadleConfig({
							tasks: [
								{ name: "build", log: "Build one" },
								{ name: "check", log: "Check one", config: { dependsOn: ["build", "two:build", "root:build"] } }
							]
						})
					}
				}
			}
		});
	});
});
