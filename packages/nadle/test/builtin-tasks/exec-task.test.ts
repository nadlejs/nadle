import { it, expect, describe } from "vitest";
import { fixture, getStdout, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("exec-task")
	.configRaw(await readConfig("exec-task.ts"))
	.dir("main")
	.build();

describe.concurrent("execTask", () => {
	it.each(["pwd-1", "pwd-2", "pwd-3", "pwd-4", "pwd-5"])("can run %s command with configured workingDir", (command) =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`${command}`);

				expect(stdout).toContain("RUN SUCCESSFUL");
			}
		})
	);
});
