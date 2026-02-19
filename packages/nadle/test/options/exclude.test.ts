import { it, expect, describe } from "vitest";
import { config, fixture, getStdout, withGeneratedFixture } from "setup";

const abcFiles = fixture()
	.packageJson("exclude")
	.config(
		config()
			.task("task-A-0")
			.task("task-A-1")
			.task("task-A-2")
			.taskWithConfig("task-A", { dependsOn: ["task-A-0", "task-A-1", "task-A-2"] })
			.task("task-B-0")
			.task("task-B-1")
			.task("task-B-2")
			.taskWithConfig("task-B", { dependsOn: ["task-B-0", "task-B-1", "task-B-2"] })
			.task("task-C-0")
			.task("task-C-1")
			.task("task-C-2")
			.taskWithConfig("task-C", {
				dependsOn: ["task-A", "task-B", "task-C-0", "task-C-1", "task-C-2"]
			})
	)
	.build();

describe.concurrent("--exclude", () => {
	it("should exclude the specified excluded task", () =>
		withGeneratedFixture({
			files: abcFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`task-A --exclude task-A-0`);

				expect(stdout).toContain("RUN SUCCESSFUL");
				expect(stdout).toRun("task-A-1");
				expect(stdout).toRun("task-A-2");
				expect(stdout).toRun("task-A");
				expect(stdout).not.toRun("task-A-0");
			}
		}));

	it("should exclude the specified excluded tasks", () =>
		withGeneratedFixture({
			files: abcFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`task-A --exclude task-A-0,task-A-1`);

				expect(stdout).toContain("RUN SUCCESSFUL");
				expect(stdout).toRun("task-A-2");
				expect(stdout).toRun("task-A");
				expect(stdout).not.toRun("task-A-0");
				expect(stdout).not.toRun("task-A-1");
			}
		}));

	it.skip("should do nothing if it is also the only main specify task", () =>
		withGeneratedFixture({
			files: abcFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`task-A --exclude task-A`);

				expect(stdout).toContain("RUN SUCCESSFUL");
				expect(stdout).toContain("No tasks were specified");
			}
		}));

	it("should run other tasks if it is also the main task", () =>
		withGeneratedFixture({
			files: abcFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`task-A task-B --exclude task-A`);

				expect(stdout).toContain("RUN SUCCESSFUL");
				expect(stdout).toRun("task-B");
				expect(stdout).not.toRun("task-A");
			}
		}));

	it("should work with dry run", () =>
		withGeneratedFixture({
			files: abcFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`task-A --exclude task-A-1 --dry-run`);

				expect(stdout).toContain("RUN SUCCESSFUL");
				expect(stdout).toContain("Execution plan");
				expect(stdout).toContain("Task task-A-0");
				expect(stdout).toContain("Task task-A-2");
				expect(stdout).toContain("Task task-A\n");
				expect(stdout).not.toContain("Task task-A-1");
			}
		}));
});
