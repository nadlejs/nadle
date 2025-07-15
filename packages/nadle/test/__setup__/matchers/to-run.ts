import { type SyncExpectationResult } from "@vitest/expect";

export function toRun(stdout: string, taskName: string): SyncExpectationResult {
	const expected = `Task ${taskName} STARTED`;
	const pass = stdout.includes(expected);

	return {
		pass,
		message: () => (pass ? `Expected stdout **not** to contain "${expected}"` : `Expected stdout to contain "${expected}", but it did not`)
	};
}
