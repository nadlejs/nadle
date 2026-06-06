import { it, expect, describe } from "vitest";
import { getStderr, withFixture, workspaceFixture } from "setup";

describe.concurrent("workspaces configure", () => {
	describe("when calling configure from sub-workspace configure file", () => {
		it("should throw an error", async () => {
			await withFixture({
				fixtureDir: "monorepo",
				testFn: async ({ exec }) => {
					await expect(getStderr(exec`build`)).resolves.toContain(`configure function can only be called from the root workspace.`);
				},
				files: workspaceFixture({
					workspaces: {
						"packages/two": { configure: { maxWorkers: 3 } }
					},
					root: { tasks: [{ name: "build" }], configure: { alias: { "packages/one": "one" } } }
				})
			});
		});
	});
});
