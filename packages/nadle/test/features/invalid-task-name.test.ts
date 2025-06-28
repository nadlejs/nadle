import Path from "node:path";

import { getStderr } from "setup";
import { createExec } from "setup";
import { fixturesDir } from "setup";
import { it, expect, describe } from "vitest";

const cwd = Path.join(fixturesDir, "invalid-task-name");

const testCases = [
	{ config: "dash", task: "build-docker", description: "contains dash character" },
	{ task: "build_docker", config: "underscore", description: "contains underscore character" },
	{ config: "colon", task: "build:docker", description: "contains colon character" },
	{ task: "", config: "empty", description: "is empty" },
	{ task: "1build", config: "start-with-number", description: "starts with a number" }
] as const;

describe.each(testCases)("when the task name $description", ({ task, config }) => {
	it("should throw invalid task name error", async () => {
		await expect(getStderr(createExec({ cwd, config })``)).resolves.toContain(
			`Invalid task name "${task}". Only alphanumeric characters are allowed, and it must start with a letter`
		);
	});
});
