import { it, expect, describe } from "vitest";
import { settle, config, fixture, createExec, withGeneratedFixture } from "setup";

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

	it("annotates task completions with descriptions in zsh", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("completion-zsh-desc")
				.config(config().taskWithConfig("build", { description: "Build the project" }).task("lint"))
				.build(),
			testFn: async ({ cwd }) => {
				const exec = createExec({ cwd, autoDisabledSummary: false, env: { SHELL: "/bin/zsh" }, autoInjectMaxWorkers: false });
				const { stdout, exitCode } = await settle(exec`--get-yargs-completions nadle ${""}`);

				expect(exitCode).toBe(0);
				// A task with a description carries `name:description`; one without stays bare.
				expect(stdout).toContain("build:Build the project");
				expect(stdout).toContain("lint");
				expect(stdout).not.toContain("lint:");
			}
		}));

	it("emits bare task names in shells without description support", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("completion-bash-desc")
				.config(config().taskWithConfig("build", { description: "Build the project" }))
				.build(),
			testFn: async ({ cwd }) => {
				const exec = createExec({ cwd, autoDisabledSummary: false, autoInjectMaxWorkers: false, env: { SHELL: "/bin/bash" } });
				const { stdout, exitCode } = await settle(exec`--get-yargs-completions nadle ${""}`);

				expect(exitCode).toBe(0);
				expect(stdout).toContain("build");
				expect(stdout).not.toContain("Build the project");
			}
		}));
});
