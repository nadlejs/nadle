import { expect } from "vitest";

import {
	serializeANSI,
	serializeVersion,
	serializeDuration,
	serializeFilePath,
	serializeLibFilePath,
	serializeFileLocation,
	serializeUnstableWords
} from "./snapshot-serializers.js";

expect.addSnapshotSerializer({
	test: (val) => typeof val === "string",
	serialize: (val) =>
		serializeVersion(serializeLibFilePath(serializeFilePath(serializeFileLocation(serializeDuration(serializeANSI(serializeUnstableWords(val)))))))
});

expect.extend({
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
	const firstTaskDoneIndex = stdout.indexOf(`Task ${firstTask} done`);
	const secondTaskStartedIndex = stdout.indexOf(`Task ${secondTask} started`);

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
