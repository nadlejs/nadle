import { it, expect, describe } from "vitest";
import { config, fixture, getStderr, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("cycle")
	.config(
		config()
			.taskWithConfig("cycle-1", { dependsOn: ["cycle-2"] })
			.taskWithConfig("cycle-2", { dependsOn: ["cycle-3"] })
			.taskWithConfig("cycle-3", { dependsOn: ["cycle-4"] })
			.taskWithConfig("cycle-4", { dependsOn: ["cycle-5"] })
			.taskWithConfig("cycle-5", { dependsOn: ["cycle-2"] })
			.taskWithConfig("cycle-6", { dependsOn: ["cycle-7"] })
			.taskWithConfig("cycle-7", { dependsOn: ["cycle-6"] })
			.taskWithConfig("cycle-8", { dependsOn: ["cycle-8"] })
	)
	.build();

describe.concurrent("detect cycle", () => {
	it("should detect cycle from a task outside the cycle", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stderr = await getStderr(exec`cycle-1`);

				expect(stderr).toContain("Cycle detected in task");
				expect(stderr).toContain("root:cycle-2");
			}
		}));

	it("should detect cycle from a task inside the cycle", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stderr = await getStderr(exec`cycle-2`);

				expect(stderr).toContain("Cycle detected in task");
				expect(stderr).toContain("root:cycle-2");
			}
		}));

	it("should print the cycle from the first reach task", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stderr = await getStderr(exec`cycle-4`);

				expect(stderr).toContain("Cycle detected in task");
				expect(stderr).toContain("root:cycle-4");
			}
		}));

	it("should detect 2-tasks-cycle", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stderr6 = await getStderr(exec`cycle-6`);

				expect(stderr6).toContain("root:cycle-6");
				expect(stderr6).toContain("root:cycle-7");

				const stderr7 = await getStderr(exec`cycle-7`);

				expect(stderr7).toContain("root:cycle-7");
				expect(stderr7).toContain("root:cycle-6");
			}
		}));

	it("should detect 1-task-cycle", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stderr = await getStderr(exec`cycle-8`);

				expect(stderr).toContain("root:cycle-8");
			}
		}));
});
