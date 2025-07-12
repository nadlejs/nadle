import Path from "node:path";

import { getStderr } from "setup";
import { createExec } from "setup";
import { fixturesDir } from "setup";
import { it, expect, describe } from "vitest";

const cwd = Path.join(fixturesDir, "invalid-task-name");

const testCases = [
	{ task: "build_docker", config: "underscore", description: "contains underscore character" },
	{ config: "colon", task: "build:docker", description: "contains colon character" },
	{ task: "build-docker-", config: "end-with-dash", description: "ends with dash character" },
	{ task: "-build-docker", config: "start-with-dash", description: "starts with dash character" },
	{ task: "", config: "empty", description: "is empty" },
	{ task: "1build", config: "start-with-number", description: "starts with a number" }
] as const;

describe.each(testCases)("when the task name $description", ({ task, config }) => {
	it("should throw invalid task name error", async () => {
		await expect(getStderr(createExec({ cwd, config })``)).resolves.toContain(
			`Invalid task name: [${task}]. Task names must contain only letters, numbers, and dashes; start with a letter, and not end with a dash.`
		);
	});
});
