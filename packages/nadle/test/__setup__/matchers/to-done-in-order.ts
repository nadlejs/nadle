import type { SyncExpectationResult } from "@vitest/expect";

export function toDoneInOrder(stdout: string, ...tasks: string[]): SyncExpectationResult {
	for (let firstTaskIndex = 0; firstTaskIndex < tasks.length - 1; firstTaskIndex++) {
		for (let secondTaskIndex = firstTaskIndex + 1; secondTaskIndex < tasks.length; secondTaskIndex++) {
			const firstTask = tasks[firstTaskIndex];
			const secondTask = tasks[secondTaskIndex];

			const firstTaskDoneIndex = stdout.indexOf(`Task ${firstTask} DONE`);
			const secondTaskDoneIndex = stdout.indexOf(`Task ${secondTask} DONE`);

			const pass = firstTaskDoneIndex < secondTaskDoneIndex;

			if (!pass) {
				return {
					pass,
					message: () => `Expected task '${firstTask}' to be done before '${secondTask}', but it did not. Stdout:\n${stdout}`
				};
			}
		}
	}

	return {
		pass: true,
		message: () => `All tasks done in the expected order.`
	};
}
