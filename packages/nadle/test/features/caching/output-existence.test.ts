import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { getStdout, withFixture, createFileModifier } from "setup";

describe.skipIf(isWindows).concurrent("output-existence verification", () => {
	it("should re-execute in the second run if declared outputs are deleted", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				await exec`bundle-resources`;
				await fileModifier.apply([{ type: "delete", path: "dist/resources/main-input.txt" }]);

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "from-cache");
			}
		}));
});
