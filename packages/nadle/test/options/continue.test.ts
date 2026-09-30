import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";
import { settle, fixture, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("continue")
	.configRaw(await readConfig("failing-chain.ts"))
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
