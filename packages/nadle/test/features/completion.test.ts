import { it, expect, describe } from "vitest";
import { settle, config, fixture, withGeneratedFixture } from "setup";

describe.concurrent("shell completion", () => {
	it("prints a completion script for the `completion` command", () =>
		withGeneratedFixture({
			files: fixture().packageJson("completion-script").config(config().task("build")).build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`completion`);

				expect(exitCode).toBe(0);
				expect(stdout).toContain("nadle-completions");
				expect(stdout).toContain("--get-yargs-completions");
			}
		}));

	it("completes live task names from the config", () =>
		withGeneratedFixture({
			files: fixture().packageJson("completion-tasks").config(config().task("build").task("lint").task("test")).build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`--get-yargs-completions nadle ${""}`);

				expect(exitCode).toBe(0);
				expect(stdout).toContain("build");
				expect(stdout).toContain("lint");
				expect(stdout).toContain("test");
			}
		}));
});
