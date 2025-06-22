import { type ExpectationResult } from "@vitest/expect";

export function toSettle(stdout: string, taskName: string, status: "done" | "up-to-date" | "from-cache" | "failed"): ExpectationResult {
	const taskDoneIndex = stdout.indexOf(`Task ${taskName} ${status.toUpperCase()}`);

	if (taskDoneIndex === -1) {
		return {
			pass: false,
			message: () => `Expected task '${taskName}' to have been marked as '${status}', but it did not. Stdout:\n${stdout}`
		};
	}

	return {
		pass: true,
		message: () => `Task '${taskName}' was successfully marked as '${status}'.`
	};
}
