import { it, expect, describe } from "vitest";
import { config, fixture, getStdout, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("empty-task")
	.config(
		config()
			.task("lifecycle")
			.taskWithConfig("real", { dependsOn: ["lifecycle"] }, "async () => {}")
	)
	.build();

describe("empty-task", () => {
	it("should suppress STARTED message for empty tasks", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`lifecycle`);

				expect(stdout).not.toContain("Task lifecycle STARTED");
				expect(stdout).toContain("Task lifecycle DONE");
			}
		}));

	it("should still print STARTED message for non-empty tasks", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`real`);

				expect(stdout).toContain("Task real STARTED");
				expect(stdout).toContain("Task real DONE");
			}
		}));

	it("should work with dependency ordering", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`real`);

				expect(stdout).toRunInOrder("lifecycle", "real");
				expect(stdout).not.toContain("Task lifecycle STARTED");
			}
		}));
});
