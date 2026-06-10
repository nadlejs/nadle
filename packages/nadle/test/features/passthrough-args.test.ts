import { isWindows } from "std-env";
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

	it("shows args on requested tasks in dry run", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build --dry-run -- -u`);

				expect(stdout).toContain("build (args: -u)");
				expect(stdout).not.toContain("compile (args:");
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

const cachedFiles = fixture()
	.packageJson("passthrough-args-cache")
	.file("input.txt", "content")
	.configRaw(
		[
			`import Path from "node:path";`,
			`import Fs from "node:fs/promises";`,
			``,
			`import { tasks, Inputs, Outputs } from "nadle";`,
			``,
			`tasks`,
			`\t.register("emit", async ({ context }) => {`,
			`\t\tawait Fs.writeFile(Path.join(context.workingDir, "out.txt"), "done");`,
			`\t})`,
			`\t.config({ inputs: [Inputs.files("input.txt")], outputs: [Outputs.files("out.txt")] });`
		].join("\n")
	)
	.build();

describe.skipIf(isWindows).concurrent("passthrough args in cache key", () => {
	it("does not reuse the no-args cache entry when args are passed", () =>
		withGeneratedFixture({
			files: cachedFiles,
			testFn: async ({ exec }) => {
				await exec`emit`;

				await expect(getStdout(exec`emit`)).resolves.toSettle("emit", "up-to-date");
				await expect(getStdout(exec`emit -- -u`)).resolves.toSettle("emit", "done");
			}
		}));

	it("keeps dependency tasks cached when args are passed to the requested task", () =>
		withGeneratedFixture({
			testFn: async ({ exec }) => {
				await exec`verify`;

				await expect(getStdout(exec`verify -- -u`)).resolves.toSettle("prepare", "up-to-date");
			},
			files: fixture()
				.packageJson("passthrough-args-cache-dep")
				.file("input.txt", "content")
				.configRaw(
					[
						`import Path from "node:path";`,
						`import Fs from "node:fs/promises";`,
						``,
						`import { tasks, Inputs, Outputs } from "nadle";`,
						``,
						`tasks`,
						`\t.register("prepare", async ({ context }) => {`,
						`\t\tawait Fs.writeFile(Path.join(context.workingDir, "out.txt"), "done");`,
						`\t})`,
						`\t.config({ inputs: [Inputs.files("input.txt")], outputs: [Outputs.files("out.txt")] });`,
						`tasks.register("verify", () => {}).config({ dependsOn: ["prepare"] });`
					].join("\n")
				)
				.build()
		}));
});
