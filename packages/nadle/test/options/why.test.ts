import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { getStdout, withFixture, createFileModifier } from "setup";

describe.skipIf(isWindows).concurrent("--why", () => {
	it("prefixes the explanation with the task label", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`bundle-resources --why`);

				expect(stdout).toContain("why bundle-resources:");
			}
		}));

	it("explains an up-to-date hit on the second run", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ exec }) => {
				await exec`bundle-resources`;

				const stdout = await getStdout(exec`bundle-resources --why`);

				expect(stdout).toContain("up-to-date");
				expect(stdout).toContain("inputs and outputs unchanged");
			}
		}));

	it("names the changed input on a cache miss", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				await exec`bundle-resources`;
				await createFileModifier(cwd).apply([{ type: "modify", newContent: "new content", path: "resources/main-input.txt" }]);

				const stdout = await getStdout(exec`bundle-resources --why`);

				expect(stdout).toContain("cache miss");
				expect(stdout).toContain("main-input.txt");
			}
		}));
});
