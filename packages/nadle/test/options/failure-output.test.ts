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

	it("reports a downstream-skipped count when dependents are skipped", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				// Requesting both dependents schedules flaky + after + alsoAfter; flaky
				// fails so the two dependents never run.
				const result = await settle(exec`after alsoAfter`);

				expect(out(result)).toContain("2 downstream tasks skipped");
			}
		}));

	it("uses singular wording for a single skipped task", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`after`);

				expect(out(result)).toContain("1 downstream task skipped");
				expect(out(result)).not.toContain("1 downstream tasks skipped");
			}
		}));

	it("omits the skipped clause when nothing downstream is skipped", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`flaky`);

				expect(out(result)).not.toContain("downstream task");
			}
		}));

	it("agent reporter emits REPRO and a skipped count", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`after --reporter agent`);

				expect(out(result)).toContain("REPRO nadle flaky");
				expect(out(result)).toContain("skipped 1");
			}
		}));
});
