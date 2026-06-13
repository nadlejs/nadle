import { it, expect, describe } from "vitest";
import { exec, fixture, readConfig, expectFail, withGeneratedFixture } from "setup";

const duplicateTasksFiles = fixture()
	.packageJson("duplicate-tasks")
	.configRaw(await readConfig("duplicate-tasks.ts"))
	.build();

describe("when register two tasks with the same name", () => {
	it("should throw error", () =>
		withGeneratedFixture({
			files: duplicateTasksFiles,
			testFn: async ({ exec }) => {
				await expect(() => exec`hello`).rejects.toThrow(`Task hello already registered in workspace root`);
			}
		}));

	// TODO(#416): mirror the root-workspace duplicate-task case above for a
	// sub-workspace — register the same task name twice inside a package of a
	// monorepo fixture and assert "Task <name> already registered in workspace <id>".
	it.todo("should throw error within workspace");
});

describe("when a task fails", () => {
	it("should report correctly", async () => {
		await expectFail(exec`throwable`);
	});
});
