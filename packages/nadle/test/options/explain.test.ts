// cspell:ignore biuld
import { it, expect, describe } from "vitest";
import { fixture, getStdout, getStderr, readConfig, withGeneratedFixture } from "setup";

const dependsOnFiles = fixture()
	.packageJson("explain")
	.configRaw(await readConfig("depends-on.ts"))
	.build();

const inputsFiles = fixture()
	.packageJson("explain-inputs")
	.file("input.txt", "hello")
	.configRaw(await readConfig("clean-cache.ts"))
	.build();

describe("--explain", () => {
	it("explains a directly requested task", () =>
		withGeneratedFixture({
			files: dependsOnFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build --explain build`);

				expect(stdout).toContain("Task:");
				expect(stdout).toContain("Why it runs:");
				expect(stdout).toContain("Requested directly on the command line.");
				expect(stdout).toContain("What depends on it:");
				expect(stdout).toContain("Nothing depends on this task.");
			}
		}));

	it("explains why a transitive task is pulled in", () =>
		withGeneratedFixture({
			files: dependsOnFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build --explain install`);

				// install is pulled in through a chain that starts at the requested root.
				expect(stdout).toContain("Pulled in by:");
				expect(stdout).toContain("build");
				expect(stdout).toContain("install");
				expect(stdout).toContain("→");

				// Its direct dependents are listed.
				expect(stdout).toContain("What depends on it:");
				expect(stdout).toContain("compileTs");
				expect(stdout).toContain("compileSvg");
				expect(stdout).toContain("test");
			}
		}));

	it("lists declared inputs and caching state", () =>
		withGeneratedFixture({
			files: inputsFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build --explain build`);

				expect(stdout).toContain("Inputs:");
				expect(stdout).toContain("file: input.txt");
				expect(stdout).toContain("caching enabled");
			}
		}));

	it("does not execute tasks", () =>
		withGeneratedFixture({
			files: dependsOnFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build --explain build`);

				expect(stdout).not.toContain("STARTED");
				expect(stdout).not.toContain("DONE");
			}
		}));

	it("errors for an unknown task", () =>
		withGeneratedFixture({
			files: dependsOnFiles,
			testFn: async ({ exec }) => {
				const stderr = await getStderr(exec`build --explain biuld`);

				expect(stderr).toContain("biuld");
				expect(stderr).toContain("not found");
			}
		}));
});
