import { it, expect, describe } from "vitest";
import { PACKAGE_JSON } from "src/core/utilities/constants.js";
import {
	fixture,
	getStdout,
	createExec,
	expectPass,
	CONFIG_FILE,
	withFixture,
	PNPM_WORKSPACE,
	createNadleConfig,
	createPackageJson,
	createPnpmWorkspace,
	withGeneratedFixture
} from "setup";

const emptyFiles = fixture().packageJson("empty").configRaw("// Nothing here\n").build();

describe("--list", () => {
	it("prints all available tasks", async () => {
		await expectPass(createExec()`--list`);
	});

	it("prints no task message when no registered tasks", () =>
		withGeneratedFixture({
			files: emptyFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`--list`);

				expect(stdout).toContain("No tasks found");
				expect(stdout).toContain("RUN SUCCESSFUL");
			}
		}));

	it("prints all tasks in workspace order", async () => {
		await withFixture({
			preserve: true,
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`--list`);
			},
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				[CONFIG_FILE]: createNadleConfig({
					tasks: [
						{ name: "build", config: { group: "build", description: "Main build task" } },
						{ name: "assemble", config: { group: "build", description: "Main assemble task" } }
					]
				}),

				packages: {
					two: {
						[PACKAGE_JSON]: createPackageJson("two", {
							version: "SNAPSHOT",
							dependencies: { one: "workspace:^" },
							devDependencies: { zero: "workspace:*" }
						})
					},
					zero: {
						[PACKAGE_JSON]: createPackageJson("zero", { version: "2.3.0-SNAPSHOT" }),
						[CONFIG_FILE]: createNadleConfig({
							tasks: [
								{ name: "assemble", config: { group: "build", description: "One assemble task" } },
								{ name: "build", config: { group: "build", description: "Zero build task" } }
							]
						})
					},
					one: {
						[PACKAGE_JSON]: createPackageJson("one", { version: "1.0.0", dependencies: { zero: "workspace:~" } }),
						[CONFIG_FILE]: createNadleConfig({
							tasks: [
								{ name: "build", config: { group: "build", description: "One build task" } },
								{ name: "compile", config: { group: "build", description: "One combine task" } }
							]
						})
					}
				}
			}
		});
	});
});
