import Path from "node:path";

import { it, expect, describe } from "vitest";
import { PACKAGE_JSON } from "src/core/utilities/constants.js";
import { getStdout, CONFIG_FILE, withFixture, PNPM_WORKSPACE, createPackageJson, createPnpmWorkspace } from "setup";

describe("workspaces > working directory", () => {
	it("should resolve workingDir relative to the workspace, not the root", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ cwd, exec }) => {
				const stdout = await getStdout(exec`packages:lib:logDir`);

				expect(stdout).toContain(Path.join(cwd, "packages", "lib"));
			},
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				[CONFIG_FILE]: `import { tasks } from "nadle";\ntasks.register("build", () => { console.log("Build root"); });\n`,

				packages: {
					lib: {
						[PACKAGE_JSON]: createPackageJson("lib"),
						[CONFIG_FILE]: [
							`import { tasks } from "nadle";`,
							`tasks.register("logDir", ({ context }) => { console.log(context.workingDir); });`
						].join("\n")
					}
				}
			}
		});
	});

	it("should resolve explicit workingDir relative to the workspace", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ cwd, exec }) => {
				const stdout = await getStdout(exec`packages:lib:logDir`);

				expect(stdout).toContain(Path.join(cwd, "packages", "lib", "src"));
			},
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root"),
				[CONFIG_FILE]: `import { tasks } from "nadle";\ntasks.register("build", () => { console.log("Build root"); });\n`,

				packages: {
					lib: {
						src: {},
						[PACKAGE_JSON]: createPackageJson("lib"),
						[CONFIG_FILE]: [
							`import { tasks } from "nadle";`,
							`tasks.register("logDir", ({ context }) => { console.log(context.workingDir); }).config({ workingDir: "src" });`
						].join("\n")
					}
				}
			}
		});
	});
});
