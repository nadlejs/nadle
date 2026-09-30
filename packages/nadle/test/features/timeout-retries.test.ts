import { it, expect, describe } from "vitest";
import { config, settle, fixture, getStdout, withGeneratedFixture } from "setup";

// A task body that fails the first `failTimes` attempts, then succeeds. Attempts are
// counted via a sidecar file under the working directory so the count survives across
// retries within the same worker.
function flakyAction(failTimes: number): string {
	return `async ({ context }) => {
		const Fs = await import("node:fs");
		const Path = await import("node:path");
		const file = Path.join(context.workingDir, ".attempts");
		const attempts = Fs.existsSync(file) ? Number(Fs.readFileSync(file, "utf-8")) : 0;
		Fs.writeFileSync(file, String(attempts + 1));
		if (attempts < ${failTimes}) {
			throw new Error("flaky failure on attempt " + (attempts + 1));
		}
	}`;
}

const NEVER_SETTLES = "() => new Promise(() => {})";

describe.concurrent("timeout and retries", () => {
	it("fails with a ConfigurationError when timeout is not a positive integer", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("timeout-invalid")
				.config(config().taskWithConfig("build", { timeout: 0 }, "() => {}"))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`build`);

				expect(exitCode).toBe(2);
				expect(stdout + stderr).toContain("invalid timeout");
			}
		}));

	it("fails with a ConfigurationError when retries is negative", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("retries-invalid")
				.config(config().taskWithConfig("build", { retries: -1 }, "() => {}"))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`build`);

				expect(exitCode).toBe(2);
				expect(stdout + stderr).toContain("invalid retries");
			}
		}));

	it("fails the task when it does not settle within the timeout", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("timeout-exceeded")
				.config(config().taskWithConfig("slow", { timeout: 50 }, NEVER_SETTLES))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`slow --stacktrace`);

				expect(exitCode).not.toBe(0);
				expect(stdout + stderr).toContain("timed out");
			}
		}));

	it("succeeds when a flaky task passes within the retry budget", () =>
		withGeneratedFixture({
			testFn: async ({ exec }) => {
				await expect(getStdout(exec`flaky`)).resolves.toSettle("flaky", "done");
			},
			files: fixture()
				.packageJson("retries-recover")
				.config(config().taskWithConfig("flaky", { retries: 2 }, flakyAction(2)))
				.build()
		}));

	it("fails when retries are exhausted", () =>
		withGeneratedFixture({
			testFn: async ({ exec }) => {
				const { exitCode } = await settle(exec`flaky`);

				expect(exitCode).not.toBe(0);
			},
			files: fixture()
				.packageJson("retries-exhausted")
				.config(config().taskWithConfig("flaky", { retries: 1 }, flakyAction(5)))
				.build()
		}));
});
