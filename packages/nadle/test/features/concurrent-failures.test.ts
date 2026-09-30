import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";
import { config, settle, fixture, withGeneratedFixture } from "setup";

// `fast` fails as soon as `slow` is provably Running, while `slow` is still mid-sleep.
// So a sibling is genuinely in flight at the moment the first failure lands — which
// used to tear the pool down and record `slow` as CANCELED, discarding its real
// outcome. `slow` must sleep rather than wait on a marker: if it waited for `fast` to
// fail it would already have thrown by teardown, and the test would pass either way.
//
// Two tasks, not more: nadle clamps the worker count to Os.availableParallelism(),
// and CI runners have few cores, so a barrier waiting on six would deadlock there.
// --max-workers must still exceed 1 — the default test harness injects
// --max-workers 1, which selects the InlineExecutor whose destroy() is a no-op, so
// the bug is unreachable there and a test without it proves nothing.
const waitFor = (marker: string) => `while (!Fs.existsSync(Path.join(process.cwd(), "${marker}"))) { await new Promise((r) => setTimeout(r, 25)); }`;

const slowBody = [
	"async () => {",
	'\tconst Fs = await import("node:fs");',
	'\tconst Path = await import("node:path");',
	'\tFs.writeFileSync(Path.join(process.cwd(), "slow.running"), "1");',
	"\tawait new Promise((resolve) => setTimeout(resolve, 2000));",
	'\tthrow new Error("slow is expected to fail");',
	"}"
].join("\n");

const fastBody = [
	"async () => {",
	'\tconst Fs = await import("node:fs");',
	'\tconst Path = await import("node:path");',
	`\t${waitFor("slow.running")}`,
	'\tFs.writeFileSync(Path.join(process.cwd(), "fast.failed"), "1");',
	'\tthrow new Error("fast is expected to fail");',
	"}"
].join("\n");

const files = fixture()
	.packageJson("concurrent-failures")
	.config(
		config()
			.task("slow", slowBody)
			.task("fast", fastBody)
			.taskWithConfig("all", { dependsOn: ["slow", "fast"] })
	)
	.build();

describe("concurrent failures", () => {
	it("reports every in-flight failure instead of cancelling siblings", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`all --reporter agent --max-workers 2`);
				const output = stripAnsi(stdout);

				expect(exitCode).toBe(1);

				for (const name of ["slow", "fast"]) {
					expect(output).toContain(`FAILED ${name}`);
					expect(output).not.toContain(`CANCELED ${name}`);
				}
			}
		}));

	it("summarizes counts that add up to the number of scheduled tasks", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const { stdout } = await settle(exec`all --reporter agent --max-workers 2`);
				const output = stripAnsi(stdout);

				// Both leaves fail; `all` never starts and both failures are in its closure.
				expect(output).toMatch(/FAILED in .+ \(done 0 failed 2 blocked 1\)/);
				expect(output).not.toContain("canceled");
			}
		}));
});
