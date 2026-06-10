import { it, expect, describe } from "vitest";
import { settle, fixture, getStdout, withGeneratedFixture } from "setup";

const echoArgs = `({ context }) => console.log("ARGS=[" + context.passthroughArgs.join(" ") + "]")`;

const files = fixture()
	.packageJson("passthrough-args")
	.configRaw(
		[
			`import { tasks } from "nadle";`,
			``,
			`tasks.register("compile", ${echoArgs});`,
			`tasks.register("build", ${echoArgs}).config({ dependsOn: ["compile"] });`,
			`tasks.register("verify", ${echoArgs});`
		].join("\n")
	)
	.build();

const execFiles = fixture()
	.packageJson("passthrough-args-exec")
	.configRaw(
		[
			`import { tasks, ExecTask } from "nadle";`,
			``,
			`tasks.register("echo-a", ExecTask, { command: "node", args: ["-e", "console.log('A:' + process.argv.slice(1).join(' '))", "--"] });`,
			`tasks.register("echo-b", ExecTask, { command: "node", args: ["-e", "console.log('B:' + process.argv.slice(1).join(' '))", "--"] });`
		].join("\n")
	)
	.build();

describe.concurrent("passthrough args", () => {
	it("passes args after -- to the requested task", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`verify -- -u --silent`);

				expect(stdout).toContain("ARGS=[-u --silent]");
			}
		}));

	it("does not pass args to dependency tasks", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build -- -u`);

				// compile (dependency) sees no args; build (requested) sees -u
				expect(stdout).toContain("ARGS=[]");
				expect(stdout).toContain("ARGS=[-u]");
			}
		}));

	it("exposes an empty array when no -- is given", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`verify`);

				expect(stdout).toContain("ARGS=[]");
			}
		}));

	it("appends args to ExecTask commands", () =>
		withGeneratedFixture({
			files: execFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`echo-a -- --flag value`);

				expect(stdout).toContain("A:--flag value");
			}
		}));

	it("appends the same args to every requested task", () =>
		withGeneratedFixture({
			files: execFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`echo-a echo-b -- --flag`);

				expect(stdout).toContain("A:--flag");
				expect(stdout).toContain("B:--flag");
			}
		}));

	it("logs a notice when multiple requested tasks receive args", () =>
		withGeneratedFixture({
			files: execFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`echo-a echo-b -- --flag`);

				expect(stdout).toContain("Passing extra arguments [--flag] to 2 tasks");
			}
		}));

	it("logs no notice for a single requested task", () =>
		withGeneratedFixture({
			files: execFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`echo-a -- --flag`);

				expect(stdout).not.toContain("Passing extra arguments");
			}
		}));

	it("still rejects unknown flags before --", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const { stderr, exitCode } = await settle(exec`verify --unknown-flag -- -u`);

				expect(exitCode).not.toBe(0);
				expect(stderr).toContain("unknown-flag");
			}
		}));
});
