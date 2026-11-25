import Process from "node:process";

import { it, expect, describe } from "vite-plus/test";
import { type Logger } from "src/core/interfaces/logger.js";
import { runCommand } from "src/builtin-tasks/run-command.js";

function captureLogger(lines: string[]): Logger {
	const ignore = () => {};

	return { info: ignore, log: (message: string) => lines.push(message) } as unknown as Logger;
}

// Writes one line in two pieces with a pause between, as tsc 7 does with its diagnostics.
const SPLIT_LINE_SCRIPT = `process.stdout.write("error TS6053: "); setTimeout(() => process.stdout.write("File not found.\\n"), 50);`;
// Writes three lines in one chunk, so grouping must not depend on how output is chunked.
const MULTI_LINE_SCRIPT = `process.stdout.write("a\\n\\nb\\n");`;
const NO_TRAILING_NEWLINE_SCRIPT = `process.stdout.write("first\\n"); setTimeout(() => process.stdout.write("last"), 50);`;

async function runNode(script: string): Promise<string[]> {
	const lines: string[] = [];
	const context = { passthroughArgs: [], workingDir: Process.cwd(), logger: captureLogger(lines) };

	await runCommand(context, { doneMessage: "done", args: ["-e", script], command: Process.execPath, startMessage: () => "start" });

	return lines;
}

describe("runCommand output", () => {
	it("logs a line written in several chunks as one log call", async () => {
		expect(await runNode(SPLIT_LINE_SCRIPT)).toEqual(["error TS6053: File not found."]);
	});

	it("logs each line of a chunk separately, blank lines included", async () => {
		expect(await runNode(MULTI_LINE_SCRIPT)).toEqual(["a", "", "b"]);
	});

	it("flushes a final line without a trailing newline when the process exits", async () => {
		expect(await runNode(NO_TRAILING_NEWLINE_SCRIPT)).toEqual(["first", "last"]);
	});
});
