import { it, expect, describe } from "vitest";
import { config, fixture, getStderr, withGeneratedFixture } from "setup";

const testCases = [
	{ task: "build_docker", description: "contains underscore character" },
	{ task: "build:docker", description: "contains colon character" },
	{ task: "build-docker-", description: "ends with dash character" },
	{ task: "-build-docker", description: "starts with dash character" },
	{ task: "", description: "is empty" },
	{ task: "1build", description: "starts with a number" }
] as const;

describe.each(testCases)("when the task name $description", ({ task }) => {
	it("should throw invalid task name error", () =>
		withGeneratedFixture({
			files: fixture().packageJson("invalid-task-name").config(config().task(task)).build(),
			testFn: async ({ exec }) => {
				await expect(getStderr(exec``)).resolves.toContain(
					`Invalid task name: [${task}]. Task names must contain only letters, numbers, and dashes; start with a letter, and not end with a dash.`
				);
			}
		}));
});
