import { it, expect, describe } from "vitest";
import { fixture, getStdout, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("working-dir")
	.configRaw(await readConfig("working-dir.ts"))
	.build();

describe.concurrent("workingDir", () => {
	it.each(["current", "oneLevelDown", "twoLevelsDown", "oneLevelUp", "twoLevelsUp"])("should print correct working directory for task %s", (task) =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`${task}`);

				expect(stdout).toContain("RUN SUCCESSFUL");
				expect(stdout).toContain("Current working directory:");
			}
		})
	);
});
