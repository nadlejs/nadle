import { it, expect, describe } from "vitest";
import { exec, fixture, readConfig, expectFail, withFixture, workspaceFixture, withGeneratedFixture } from "setup";

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

	it("should throw error within workspace", () =>
		withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expect(() => exec`build`).rejects.toThrow(`Task hello already registered in workspace packages:one`);
			},
			files: workspaceFixture({
				root: { tasks: [{ name: "build" }] },
				workspaces: {
					"packages/one": { rawConfig: 'import { tasks } from "nadle";\n\ntasks.register("hello");\ntasks.register("hello");\n' }
				}
			})
		}));
});

describe("when a task fails", () => {
	it("should report correctly", async () => {
		await expectFail(exec`throwable`);
	});
});
