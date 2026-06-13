import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";
import { settle, config, fixture, withGeneratedFixture } from "setup";

// Deterministic rendezvous: fail-task busy-waits until success-task has written
// its marker file, guaranteeing success-task is already Running (not merely
// scheduled) before fail-task throws. This makes the *outcomes* deterministic —
// success-task is always cancelable. We assert the outcomes directly rather than
// snapshotting full stdout, because the interleaving of STARTED log lines is a
// separate reporter-flush timing detail unrelated to cancellation behavior.
const files = fixture()
	.packageJson("graceful-cancellation")
	.config(
		config()
			.task(
				"success-task",
				[
					"async () => {",
					'\tconst Fs = await import("node:fs");',
					'\tconst Path = await import("node:path");',
					'\tFs.writeFileSync(Path.join(process.cwd(), "success-running.marker"), "1");',
					"\tawait new Promise((resolve) => setTimeout(resolve, 5000));",
					"}"
				].join("\n")
			)
			.task(
				"fail-task",
				[
					"async () => {",
					'\tconst Fs = await import("node:fs");',
					'\tconst Path = await import("node:path");',
					'\tconst marker = Path.join(process.cwd(), "success-running.marker");',
					"\twhile (!Fs.existsSync(marker)) {",
					"\t\tawait new Promise((resolve) => setTimeout(resolve, 25));",
					"\t}",
					'\tthrow new Error("This task is expected to fail");',
					"}"
				].join("\n")
			)
			.taskWithConfig("main-task", { dependsOn: ["fail-task", "success-task"] })
	)
	.build();

describe("graceful cancellation", () => {
	it("should report other running tasks as canceled instead of failed", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`main-task --max-workers 2`);
				const output = stripAnsi(stdout);

				expect(exitCode).toBe(1);
				expect(output).toSettle("fail-task", "failed");
				expect(output).toSettle("success-task", "canceled");
			}
		}));
});
