import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";
import { config, settle, fixture, getStdout, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("agent-reporter")
	.config(
		config()
			.task("a")
			.task("b")
			.taskWithConfig("c", { dependsOn: ["a", "b"] })
	)
	.build();

describe("agent reporter", () => {
	it("emits compact plain lines per task and a summary", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`--reporter=agent c`, { stripAnsi: true });

				// one compact line per task, no banner / footer / colors
				expect(stdout).toContain("DONE a");
				expect(stdout).toContain("DONE b");
				expect(stdout).toContain("DONE c");
				expect(stdout).toMatch(/SUCCESS in .+ \(done 3\)/);

				// none of the default reporter's decorations
				expect(stdout).not.toContain("Welcome to Nadle");
				expect(stdout).not.toContain("STARTED");
				expect(stdout).not.toContain("RUN SUCCESSFUL");
			}
		}));

	it("reports a failing task and a FAILED summary", () =>
		withGeneratedFixture({
			files: fixture().packageJson("agent-reporter-fail").config(config().task("boom", '() => { throw new Error("kaboom"); }')).build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`--reporter=agent boom`);
				const clean = stripAnsi(stdout);

				expect(exitCode).toBe(1);
				expect(clean).toContain("FAILED boom");
				expect(clean).toMatch(/FAILED in .+ \(done 0 failed 1\)/);
			}
		}));
});
