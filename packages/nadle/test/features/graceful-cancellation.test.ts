import { expectFail } from "setup";
import { it, describe } from "vitest";
import { config, fixture, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("graceful-cancellation")
	.config(
		config()
			.task("success-task", "async () => {\n\tawait new Promise((resolve) => setTimeout(resolve, 3000));\n}")
			.task(
				"fail-task",
				'async () => {\n\tawait new Promise((resolve) => setTimeout(resolve, 1000));\n\n\tthrow new Error("This task is expected to fail");\n}'
			)
			.taskWithConfig("main-task", { dependsOn: ["fail-task", "success-task"] })
	)
	.build();

describe("graceful cancellation", { retry: 10 }, () => {
	it("should report other running tasks as canceled instead of failed", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				await expectFail(exec`main-task --max-workers 2`);
			}
		}));
});
