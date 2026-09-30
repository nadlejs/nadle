import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";
import { settle, fixture, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("failure-output")
	.configRaw(await readConfig("failing-chain.ts"))
	.build();

const out = (result: Awaited<ReturnType<typeof settle>>) => stripAnsi(result.stdout);

describe("failure output", () => {
	it("prints a repro command for the failing task", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`flaky`);

				expect(result.exitCode).not.toBe(0);
				expect(out(result)).toContain("to re-run just this task: nadle flaky");
			}
		}));

	it("includes passthrough args in the repro command when the failing task was requested", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`flaky -- --foo`);

				expect(out(result)).toContain("to re-run just this task: nadle flaky -- --foo");
			}
		}));

	it("reports a blocked count when dependents never run", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				// Requesting both dependents schedules flaky + after + alsoAfter; flaky
				// fails, so both dependents are blocked by a failure in their closure.
				const result = await settle(exec`after alsoAfter`);

				expect(out(result)).toContain("2 tasks blocked");
				expect(out(result)).not.toContain("not started");
			}
		}));

	it("uses singular wording for a single blocked task", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`after`);

				expect(out(result)).toContain("1 task blocked");
				expect(out(result)).not.toContain("1 tasks blocked");
			}
		}));

	it("omits both counts when every scheduled task reached a terminal status", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`flaky`);

				expect(out(result)).not.toContain("blocked");
				expect(out(result)).not.toContain("not started");
			}
		}));

	it("counts only the task with a failure in its closure as blocked", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				// `independent` is unrelated to the failure and still completes under
				// fail-fast, so only `gate` never runs — and flaky is in its closure.
				const result = await settle(exec`gate`);

				expect(result.exitCode).not.toBe(0);
				expect(out(result)).toContain("1 task executed");
				expect(out(result)).toContain("1 task blocked");
				expect(out(result)).not.toContain("not started");
			}
		}));

	it("agent reporter emits REPRO and a blocked count", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`after --reporter agent`);

				expect(out(result)).toContain("REPRO nadle flaky");
				expect(out(result)).toContain("blocked 1");
				expect(out(result)).not.toContain("not-run");
			}
		}));
});
