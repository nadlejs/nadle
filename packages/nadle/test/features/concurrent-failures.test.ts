import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";
import { config, settle, fixture, withGeneratedFixture } from "setup";

const FAILING_TASKS = ["p1", "p2", "p3", "p4", "p5", "p6"];

// Every leaf busy-waits until all of them have written a marker, so each one is
// provably Running before any of them throws. Whichever throws first used to tear
// the pool down and turn its five still-running siblings into CANCELED, discarding
// their real outcomes. --max-workers must exceed 1: the default test harness injects
// --max-workers 1, which selects the InlineExecutor whose destroy() is a no-op, so
// the bug is unreachable there and a test without it proves nothing.
const body = (name: string) =>
	[
		"async () => {",
		'\tconst Fs = await import("node:fs");',
		'\tconst Path = await import("node:path");',
		`\tFs.writeFileSync(Path.join(process.cwd(), "${name}.marker"), "1");`,
		`\tconst others = ${JSON.stringify(FAILING_TASKS)};`,
		"\twhile (!others.every((o) => Fs.existsSync(Path.join(process.cwd(), o + '.marker')))) {",
		"\t\tawait new Promise((resolve) => setTimeout(resolve, 25));",
		"\t}",
		`\tthrow new Error("${name} is expected to fail");`,
		"}"
	].join("\n");

const files = fixture()
	.packageJson("concurrent-failures")
	.config(FAILING_TASKS.reduce((builder, name) => builder.task(name, body(name)), config()).taskWithConfig("all", { dependsOn: FAILING_TASKS }))
	.build();

describe("concurrent failures", () => {
	it("reports every in-flight failure instead of cancelling siblings", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`all --reporter agent --max-workers ${FAILING_TASKS.length}`);
				const output = stripAnsi(stdout);

				expect(exitCode).toBe(1);

				for (const name of FAILING_TASKS) {
					expect(output).toContain(`FAILED ${name}`);
					expect(output).not.toContain(`CANCELED ${name}`);
				}
			}
		}));

	it("summarizes counts that add up to the number of scheduled tasks", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const { stdout } = await settle(exec`all --reporter agent --max-workers ${FAILING_TASKS.length}`);
				const output = stripAnsi(stdout);

				// 6 leaves fail; `all` never starts, so it is the single not-run task.
				expect(output).toMatch(/FAILED in .+ \(done 0 failed 6 not-run 1\)/);
				expect(output).not.toContain("canceled");
			}
		}));
});
