import { expect } from "vitest";

import { serialize } from "./serialize.js";

expect.addSnapshotSerializer({ serialize, test: (val) => typeof val === "string" });

expect.extend({
	toDoneInOrder(stdout: string, ...tasks: string[]) {
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
	},
	toRunInOrder(stdout: string, ...groups: (string[] | string)[]) {
		for (let firstGroupIndex = 0; firstGroupIndex < groups.length - 1; firstGroupIndex++) {
			for (let secondGroupIndex = firstGroupIndex + 1; secondGroupIndex < groups.length; secondGroupIndex++) {
				const firstGroup = (Array.isArray(groups[firstGroupIndex]) ? groups[firstGroupIndex] : [groups[firstGroupIndex]]) as string[];
				const secondGroup = (Array.isArray(groups[secondGroupIndex]) ? groups[secondGroupIndex] : [groups[secondGroupIndex]]) as string[];

				for (const firstTask of firstGroup) {
					for (const secondTask of secondGroup) {
						const result = assertOrder(stdout, firstTask, secondTask);

						if (!result.pass) {
							return result;
						}
					}
				}
			}
		}

		return {
			pass: true,
			message: () => `All tasks ran in the expected order.`
		};
	}
});

function assertOrder(stdout: string, firstTask: string, secondTask: string) {
	const firstTaskDoneIndex = stdout.indexOf(`Task ${firstTask} DONE`);
	const secondTaskStartedIndex = stdout.indexOf(`Task ${secondTask} STARTED`);

	if (firstTaskDoneIndex === -1) {
		return {
			pass: false,
			message: () => `Expected task '${firstTask}' to have run, but it did not. Stdout:\n${stdout}`
		};
	}

	if (secondTaskStartedIndex === -1) {
		return {
			pass: false,
			message: () => `Expected task '${secondTask}' to have run, but it did not. Stdout:\n${stdout}`
		};
	}

	const pass = firstTaskDoneIndex < secondTaskStartedIndex;

	return {
		pass,
		message: () =>
			pass
				? `Expected task '${firstTask}' not to run before '${secondTask}', but it did. Stdout:\n${stdout}`
				: `Expected task '${firstTask}' to run before '${secondTask}', but the order was incorrect. Stdout:\n${stdout}`
	};
}
