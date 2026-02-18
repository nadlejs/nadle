import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { getStdout, withFixture, createFileModifier } from "setup";

describe.skipIf(isWindows)("caching-input", () => {
	it("should allow to specify inputs with braces", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-input",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				await exec`bundle-resources --stacktrace`;
				await fileModifier.apply([{ type: "modify", newContent: "new content", path: "resources/a-input.txt" }]);

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "up-to-date");
			}
		}));
});
