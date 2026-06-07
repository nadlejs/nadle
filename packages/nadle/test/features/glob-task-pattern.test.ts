import { it, expect, describe } from "vitest";
import { config, settle, fixture, getStdout, withGeneratedFixture } from "setup";

const files = fixture().packageJson("glob-pattern").config(config().task("build").task("build-css").task("build-js").task("test")).build();

describe.concurrent("glob task patterns", () => {
	it("runs every task matching a glob pattern", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build*`);

				expect(stdout).toRun("build");
				expect(stdout).toRun("build-css");
				expect(stdout).toRun("build-js");
				expect(stdout).not.toRun("test");
			}
		}));

	it("excludes tasks matching a glob pattern", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build* --exclude build-*`);

				expect(stdout).toRun("build");
				expect(stdout).not.toRun("build-css");
				expect(stdout).not.toRun("build-js");
			}
		}));

	it("fails when a glob pattern matches no task", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const { stderr, exitCode } = await settle(exec`nope*`);

				expect(exitCode).not.toBe(0);
				expect(stderr).toContain("No task matching pattern");
			}
		}));
});
