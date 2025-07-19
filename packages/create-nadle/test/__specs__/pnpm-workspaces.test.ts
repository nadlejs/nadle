import { execa } from "execa";
import { it, describe } from "vitest";
import { cliPath, expectPass, createExec, withFixture, PACKAGE_JSON, PNPM_WORKSPACE, createPackageJson, createPnpmWorkspace } from "setup";

describe("given a pnpm monorepo project", () => {
	it("should should initialize nadle properly", async () => {
		await withFixture({
			preserve: true,
			fixtureDir: "monorepo",
			files: {
				[PNPM_WORKSPACE]: createPnpmWorkspace(),
				[PACKAGE_JSON]: createPackageJson("root")
			},
			testFn: async ({ cwd }) => {
				await execa(cliPath, [], { cwd, stdio: "inherit" });
				await expectPass(createExec({ cwd, command: "pnpm" })`nadle build`);
			}
		});
	});
});
