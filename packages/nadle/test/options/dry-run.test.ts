import { it, expect, describe } from "vitest";
import { exec, fixture, getStdout, readConfig, expectPass, withGeneratedFixture } from "setup";

const dependsOnFiles = fixture()
	.packageJson("dry-run")
	.configRaw(await readConfig("depends-on.ts"))
	.build();

describe("--dry-run", () => {
	it("should list for one task", async () => {
		await expectPass(exec`hello --dry-run`);
	});

	it("should list for dependent tasks", () =>
		withGeneratedFixture({
			files: dependsOnFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build --dry-run`);

				expect(stdout).toContain("Execution plan");
				expect(stdout).toContain("RUN SUCCESSFUL");
				expect(stdout).toContain("node");
				expect(stdout).toContain("install");
				expect(stdout).toContain("compile");
				expect(stdout).toContain("build");
			}
		}));
});
