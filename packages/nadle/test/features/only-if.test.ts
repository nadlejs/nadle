import { it, expect, describe } from "vitest";
import { raw, config, settle, fixture, withGeneratedFixture } from "setup";

const WRITE_MARKER = `async ({ context }) => {
	const Fs = await import("node:fs");
	const Path = await import("node:path");
	Fs.writeFileSync(Path.join(context.workingDir, "ran.txt"), "ran");
}`;

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
});
