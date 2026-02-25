import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { getStdout, withFixture, createFileModifier } from "setup";

describe.skipIf(isWindows).concurrent("dependency fingerprint caching", () => {
	it("should execute both tasks on first run", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-dependency",
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`compile-b`);

				expect(stdout).toSettle("compile-a", "done");
				expect(stdout).toSettle("compile-b", "done");
			}
		}));

	it("should be up-to-date on second run when no inputs change", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-dependency",
			testFn: async ({ exec }) => {
				await exec`compile-b`;

				const stdout = await getStdout(exec`compile-b`);

				expect(stdout).toSettle("compile-a", "up-to-date");
				expect(stdout).toSettle("compile-b", "up-to-date");
			}
		}));

	it("should re-execute downstream task when upstream input changes", { timeout: 60_000 }, () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-dependency",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				await exec`compile-b`;
				await fileModifier.apply([{ type: "modify", newContent: "changed", path: "src-a/input.txt" }]);

				const stdout = await getStdout(exec`compile-b`);

				expect(stdout).toSettle("compile-a", "done");
				expect(stdout).toSettle("compile-b", "done");
			}
		})
	);

	it("should keep downstream up-to-date when only downstream input changes", { timeout: 60_000 }, () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-dependency",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				await exec`compile-b`;
				await fileModifier.apply([{ type: "modify", newContent: "changed", path: "src-b/input.txt" }]);

				const stdout = await getStdout(exec`compile-b`);

				expect(stdout).toSettle("compile-a", "up-to-date");
				expect(stdout).toSettle("compile-b", "done");
			}
		})
	);
});
