import { type SyncExpectationResult } from "@vitest/expect";

export function toRun(stdout: string, taskName: string): SyncExpectationResult {
	const started = `Task ${taskName} STARTED`;
	const done = `Task ${taskName} DONE`;
	const pass = stdout.includes(started) || stdout.includes(done);

	return {
		pass,
		message: () =>
			pass ? `Expected stdout **not** to contain "${started}" or "${done}"` : `Expected stdout to contain "${started}" or "${done}", but it did not`
	};
}
