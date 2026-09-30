import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";
import { settle, fixture, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("continue")
	.configRaw(await readConfig("failing-chain.ts"))
	.build();

const cachingFiles = fixture()
	.packageJson("continue-caching")
	.configRaw(await readConfig("continue-caching.ts"))
	.file("input.txt", "input")
	.build();

const out = (result: Awaited<ReturnType<typeof settle>>) => stripAnsi(result.stdout);

describe("--continue", () => {
	it("reaches a later unaffected task tree after a failure", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				// Sequential: flaky is the first main task and fails, and the two trees after
				// it are entirely blocked. --continue must walk past them to reach
				// `independent`, which has no failure in its closure.
				const result = await settle(exec`flaky after alsoAfter independent gate --continue`);

				expect(result.exitCode).not.toBe(0);
				expect(out(result)).toContain("INDEPENDENT RAN");
				expect(out(result)).toContain("1 task executed");
				expect(out(result)).toContain("3 tasks blocked");
				expect(out(result)).not.toContain("not started");
			}
		}));

	it("stops at the failure without the flag", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				// The same graph under fail-fast: the run ends at flaky, so `independent`
				// never runs and is reported not started rather than blocked.
				const result = await settle(exec`flaky after alsoAfter independent gate`);

				expect(result.exitCode).not.toBe(0);
				expect(out(result)).not.toContain("INDEPENDENT RAN");
				expect(out(result)).toContain("1 task not started");
			}
		}));

	it("still blocks dependents of the failed task", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`after alsoAfter --continue --parallel --max-workers 2`);

				expect(result.exitCode).not.toBe(0);
				expect(out(result)).toContain("2 tasks blocked");
				expect(out(result)).not.toContain("not started");
			}
		}));

	it("fails the run even though execution continued", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`gate --continue --parallel --max-workers 2`);

				expect(result.exitCode).not.toBe(0);
				expect(out(result)).toContain("INDEPENDENT RAN");
				expect(out(result)).toContain("RUN FAILED");
				expect(out(result)).toContain("1 task blocked");
			}
		}));
});

// All three exercise the InlineExecutor: no --max-workers means the harness injects
// --max-workers 1, which selects the inline path. The graph is sequential multi-root,
// the shape where --continue is actually distinguishable from plain fail-fast.
describe("--continue and caching", () => {
	it("still caches a task that succeeds during a failed run", () =>
		withGeneratedFixture({
			files: cachingFiles,
			testFn: async ({ exec }) => {
				const first = await settle(exec`failing cacheable --continue`);

				expect(first.exitCode).not.toBe(0);
				expect(out(first)).toSettle("cacheable", "done");

				// Cache writes are gated on the task's own outcome, not the run's,
				// so the succeeding task is up-to-date on the next invocation.
				const second = await settle(exec`cacheable`);

				expect(second.exitCode).toBe(0);
				expect(out(second)).toSettle("cacheable", "up-to-date");
			}
		}));

	it("does not cache a task blocked by the failure", () =>
		withGeneratedFixture({
			files: cachingFiles,
			testFn: async ({ exec }) => {
				const first = await settle(exec`failing blockedCacheable --continue`);

				expect(first.exitCode).not.toBe(0);

				// A blocked task never ran, so it must not look fresh afterwards:
				// recording it as up-to-date would skip work that never happened.
				// This is the assertion that matters — it holds whether or not the
				// first run reported the task as blocked.
				const second = await settle(exec`blockedCacheable --continue`);

				expect(out(second)).not.toSettle("blockedCacheable", "up-to-date");
				expect(out(second)).not.toSettle("blockedCacheable", "from-cache");
				expect(out(first)).toContain("1 task blocked");
			}
		}));

	it("does not cache a task the run never reached before stopping at the failure", () =>
		withGeneratedFixture({
			files: cachingFiles,
			testFn: async ({ exec }) => {
				// Without --continue the run ends at `failing`, so `cacheable` never starts.
				const first = await settle(exec`failing cacheable`);

				expect(first.exitCode).not.toBe(0);
				expect(out(first)).not.toSettle("cacheable", "done");

				const second = await settle(exec`cacheable`);

				expect(second.exitCode).toBe(0);
				expect(out(second)).toSettle("cacheable", "done");
			}
		}));
});
