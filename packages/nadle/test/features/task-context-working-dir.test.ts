import Path from "node:path";

import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { fixture, getStdout, readConfig, createExec, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("task-context-working-dir")
	.configRaw(await readConfig("task-context-working-dir.ts"))
	.dir("src/main")
	.dir("src/test")
	.build();

describe.concurrent.skipIf(isWindows)("task-context-working-dir", () => {
	it("should resolve correct working dir regarding to the projectDir", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ cwd }) => {
				const exec = createExec({ cwd: Path.join(cwd, "src", "main") });
				const stdout = await getStdout(exec`withConfiguredWorkingDir`);

				expect(stdout).toContain("src/test");
			}
		}));

	it("should resolve to projectDir if no given workingDir", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ cwd }) => {
				const exec = createExec({ cwd: Path.join(cwd, "src", "main") });
				const stdout = await getStdout(exec`withoutWorkingDir`);

				expect(stdout).not.toContain("src/test");
				expect(stdout).toContain("Hello from");
			}
		}));
});
