import Path from "node:path";
import Fs from "node:fs/promises";

import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";
import { config, settle, fixture, poolWorkers, withGeneratedFixture } from "setup";

import { isPathExists } from "../../src/core/utilities/fs.js";

// Covers what only PoolExecutor does: dispatching into tinypool worker threads and
// the MessageChannel/port notify path. InlineExecutor bypasses both, and the harness
// injects --max-workers 1 by default, so every test here opts in via poolWorkers().

// Each task blocks until its sibling has announced itself. Both can only finish if
// they occupy two worker threads at once, so the run proves real pool concurrency.
// The wait is bounded so a serialized executor fails the assertion instead of hanging.
const rendezvous = (mine: string, theirs: string) =>
	[
		"async () => {",
		'\tconst Fs = await import("node:fs");',
		'\tconst Path = await import("node:path");',
		`\tconst dir = Path.join(process.cwd(), "rendezvous");`,
		"\tFs.mkdirSync(dir, { recursive: true });",
		`\tFs.writeFileSync(Path.join(dir, "${mine}"), "1");`,
		"\tconst deadline = Date.now() + 8000;",
		`\twhile (!Fs.existsSync(Path.join(dir, "${theirs}"))) {`,
		"\t\tif (Date.now() > deadline) { throw new Error(`${mine} never met ${theirs}`); }",
		"\t\tawait new Promise((r) => setTimeout(r, 25));",
		"\t}",
		"}"
	].join("\n");

const concurrentFiles = fixture()
	.packageJson("pool-concurrent")
	.config(
		config()
			.task("left", rendezvous("left", "right"))
			.task("right", rendezvous("right", "left"))
			.taskWithConfig("both", { dependsOn: ["left", "right"] })
	)
	.build();

const CACHEABLE_CONFIG = `import { tasks, Inputs, Outputs } from "nadle";

tasks.register("build", {
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("out")],
	run: async ({ context }) => {
		const Fs = await import("node:fs");
		const Path = await import("node:path");
		Fs.mkdirSync(Path.join(context.workingDir, "out"), { recursive: true });
		Fs.writeFileSync(Path.join(context.workingDir, "out", "artifact.txt"), "built");
		Fs.appendFileSync(Path.join(context.workingDir, "runs.log"), "run\\n");
	}
});
`;

const cacheableFiles = fixture().packageJson("pool-cacheable").file("src/input.txt", "one\n").configRaw(CACHEABLE_CONFIG).build();

describe("pool executor", () => {
	it("runs two tasks concurrently on separate worker threads", () =>
		withGeneratedFixture({
			files: concurrentFiles,
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`both ${poolWorkers()}`);
				const output = stripAnsi(stdout);

				expect(exitCode).toBe(0);
				expect(output).not.toContain("never met");
				expect(output).toSettle("left", "done");
				expect(output).toSettle("right", "done");
			}
		}));

	it("delivers the up-to-date verdict over the worker message port", () =>
		withGeneratedFixture({
			files: cacheableFiles,
			testFn: async ({ cwd, exec }) => {
				expect((await settle(exec`build ${poolWorkers()}`)).exitCode).toBe(0);
				await expect(isPathExists(Path.join(cwd, "runs.log"))).resolves.toBe(true);

				const { stdout, exitCode } = await settle(exec`build ${poolWorkers()}`);

				// The up-to-date verdict is decided inside the worker thread and reaches the
				// pool only as a port message. Break the port and the rerun is reported as a
				// plain execution instead.
				expect(exitCode).toBe(0);
				expect(stripAnsi(stdout)).toSettle("build", "up-to-date");
			}
		}));

	it("delivers the from-cache verdict over the worker message port", () =>
		withGeneratedFixture({
			files: cacheableFiles,
			testFn: async ({ cwd, exec }) => {
				const input = Path.join(cwd, "src", "input.txt");
				const write = (content: string) => Fs.writeFile(input, content);

				await settle(exec`build ${poolWorkers()}`);
				await write("two\n");
				await settle(exec`build ${poolWorkers()}`);
				await write("one\n");

				// Restoring outputs happens in the worker thread; only the resulting
				// from-cache message crosses the port. A broken port reports a re-execution.
				const { stdout, exitCode } = await settle(exec`build ${poolWorkers()}`);

				expect(exitCode).toBe(0);
				expect(stripAnsi(stdout)).toSettle("build", "from-cache");
			}
		}));
});
