import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { getStdout, withFixture, createFileModifier } from "setup";

describe.skipIf(isWindows).concurrent("basic caching", () => {
	it("should execute in the first run", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ exec }) => {
				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
			}
		}));

	it("should be up-to-date in the second run if inputs do not change", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ exec }) => {
				await exec`bundle-resources`;

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "up-to-date");
			}
		}));

	it("should re-execute in the second run if inputs change", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				await exec`bundle-resources`;
				await fileModifier.apply([{ type: "modify", newContent: "new content", path: "resources/main-input.txt" }]);

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
			}
		}));

	it("should re-execute in the second run if a input file is deleted", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				await exec`bundle-resources`;
				await fileModifier.apply([{ type: "delete", path: "resources/main-input.txt" }]);

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
			}
		}));

	it("should re-execute in the second run if a new file is added", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				await exec`bundle-resources`;
				await fileModifier.apply([{ type: "add", content: "new file added", path: "resources/main-input-2.txt" }]);

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
			}
		}));

	it("should restore from cache in the third run if a file is added before and deleted after the second run", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				await exec`bundle-resources`;

				await fileModifier.apply([{ type: "add", content: "new file added", path: "resources/main-input-3.txt" }]);
				await exec`bundle-resources`;
				await fileModifier.apply([{ type: "delete", path: "resources/main-input-3.txt" }]);

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "from-cache");
			}
		}));

	it("should miss cache when config file changes", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				await exec`bundle-resources`;

				await fileModifier.apply([
					{
						type: "modify",
						path: "nadle.config.ts",
						newContent: (currentContent) => `${currentContent}\ntasks.register("build");`
					}
				]);

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
			}
		}));
});
