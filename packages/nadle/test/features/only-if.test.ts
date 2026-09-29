import Path from "node:path";

import stripAnsi from "strip-ansi";
import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { raw, config, settle, fixture, withGeneratedFixture } from "setup";

import { isPathExists } from "../../src/core/utilities/fs.js";

const DEFAULT_CACHE_DIR = "node_modules/.cache/nadle";

/** Every outcome explainCacheOutcome can emit; none may appear for a skipped task. */
const CACHE_OUTCOMES = ["not cacheable", "caching disabled", "up-to-date", "restored from cache", "cache miss"];

const WRITE_MARKER = `async ({ context }) => {
	const Fs = await import("node:fs");
	const Path = await import("node:path");
	Fs.writeFileSync(Path.join(context.workingDir, "ran.txt"), "ran");
}`;

/**
 * A fully cacheable task that is always skipped. Declares real inputs and outputs so
 * validate() would have work to do, and a body that would write dist/out.txt if it ran.
 */
const CACHEABLE_SKIPPED_CONFIG = `import Fs from "node:fs";
import Path from "node:path";

import { tasks, Inputs, Outputs } from "nadle";

tasks.register("build", {
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("dist")],
	onlyIf: () => false,
	run: ({ context }) => {
		Fs.mkdirSync(Path.join(context.workingDir, "dist"), { recursive: true });
		Fs.writeFileSync(Path.join(context.workingDir, "dist", "out.txt"), "out");
	}
});
`;

describe.concurrent("onlyIf", () => {
	it("skips the task when the predicate returns false", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("only-if-false")
				.config(config().taskWithConfig("build", { onlyIf: raw("() => false") }, WRITE_MARKER))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`build`);

				expect(exitCode).toBe(0);
				expect(stdout).toContain("SKIPPED");
			}
		}));

	it("runs the task when the predicate returns true", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("only-if-true")
				.config(config().taskWithConfig("build", { onlyIf: raw("() => true") }, "() => {}"))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`build`);

				expect(exitCode).toBe(0);
				expect(stdout).not.toContain("SKIPPED");
				expect(stdout).toContain("DONE");
			}
		}));

	it("skips when an async predicate resolves false", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("only-if-async")
				.config(config().taskWithConfig("build", { onlyIf: raw("async () => false") }, "() => {}"))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`build`);

				expect(exitCode).toBe(0);
				expect(stdout).toContain("SKIPPED");
			}
		}));

	// Review Focus 1: truthiness, not === false.
	it("skips on any falsey predicate result", () =>
		withGeneratedFixture({
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`empty zero nothing`);

				expect(exitCode).toBe(0);
				expect(stdout.match(/SKIPPED/g)).toHaveLength(3);
			},
			files: fixture()
				.packageJson("only-if-falsey")
				.config(
					config()
						.taskWithConfig("empty", { onlyIf: raw('() => ""') }, "() => {}")
						.taskWithConfig("zero", { onlyIf: raw("() => 0") }, "() => {}")
						.taskWithConfig("nothing", { onlyIf: raw("() => undefined") }, "() => {}")
				)
				.build()
		}));

	it("does not run the task body when skipped", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("only-if-no-body")
				.config(config().taskWithConfig("build", { onlyIf: raw("() => false") }, WRITE_MARKER))
				.build(),
			testFn: async ({ cwd, exec }) => {
				const Fs = await import("node:fs");
				const Path = await import("node:path");

				await settle(exec`build`);

				expect(Fs.existsSync(Path.join(cwd, "ran.txt"))).toBe(false);
			}
		}));

	it("fails the task when the predicate throws", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("only-if-throws")
				.config(config().taskWithConfig("build", { onlyIf: raw('() => { throw new Error("boom"); }') }, "() => {}"))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`build --stacktrace`);

				expect(exitCode).not.toBe(0);
				expect(stdout + stderr).toContain("boom");
			}
		}));

	// Review Focus 2: a rejected promise behaves like a synchronous throw.
	it("fails the task when an async predicate rejects", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("only-if-rejects")
				.config(config().taskWithConfig("build", { onlyIf: raw('async () => { throw new Error("boom"); }') }, "() => {}"))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`build --stacktrace`);

				expect(exitCode).not.toBe(0);
				expect(stdout + stderr).toContain("boom");
			}
		}));

	// A skipped task must do no cache work: the predicate is evaluated before the
	// cache validator exists, so no fingerprint is computed even with inputs/outputs.
	it("does no cache work when skipped despite declaring inputs and outputs", () =>
		withGeneratedFixture({
			files: fixture().packageJson("only-if-no-cache-work").file("src/input.txt", "input").configRaw(CACHEABLE_SKIPPED_CONFIG).build(),
			testFn: async ({ cwd, exec }) => {
				const { exitCode } = await settle(exec`build`);

				expect(exitCode).toBe(0);
				await expect(isPathExists(Path.join(cwd, "dist/out.txt"))).resolves.toBe(false);
				await expect(isPathExists(Path.join(cwd, DEFAULT_CACHE_DIR))).resolves.toBe(false);
			}
		}));

	// Pins the ordering itself: the --why line is derived from validationResult, so it
	// can only appear once validate() has run. A skipped task must print no such line.
	it.skipIf(isWindows)("computes no cache outcome when skipped, observable under --why", () =>
		withGeneratedFixture({
			files: fixture().packageJson("only-if-why").file("src/input.txt", "input").configRaw(CACHEABLE_SKIPPED_CONFIG).build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`build --why`);

				expect(exitCode).toBe(0);
				expect(stdout).not.toContain("why build:");

				for (const outcome of CACHE_OUTCOMES) {
					expect(stdout).not.toContain(outcome);
				}
			}
		})
	);

	it("reports skipped tasks in the run summary", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("only-if-summary")
				.config(config().taskWithConfig("build", { onlyIf: raw("() => false") }, "() => {}"))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`build`);

				expect(exitCode).toBe(0);
				expect(stdout).toContain("RUN SUCCESSFUL");
				expect(stripAnsi(stdout)).toMatch(/1 task skipped/);
			}
		}));
});
