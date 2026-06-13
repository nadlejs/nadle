import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { watchSession, withFixture, createFileModifier } from "setup";

// Windows file-watching is the #420 risk area; start skipped there.
describe.skipIf(isWindows)("--watch", () => {
	it("runs once and then watches", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ exec }) => {
				const session = watchSession(exec`bundle-resources --watch`);

				const first = await session.waitFor("Watching for changes");

				expect(first).toContain("bundle-resources");

				const exitCode = await session.stop();

				expect(exitCode).toBe(0);
			}
		}));

	it("re-runs when a watched input changes", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				const session = watchSession(exec`bundle-resources --watch`);
				await session.waitFor("Watching for changes");

				await createFileModifier(cwd).apply([{ type: "modify", newContent: "changed", path: "resources/main-input.txt" }]);

				// A second "Watching" line proves the change triggered another run cycle.
				const second = await session.waitFor("Watching for changes");

				expect(second).toContain("Watching for changes");

				await session.stop();
			}
		}));

	it("warns and exits when the task has no inputs", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "main",
			testFn: async ({ exec }) => {
				const session = watchSession(exec`hello --watch`);

				const out = await session.waitFor("nothing to watch");

				expect(out).toContain("No watchable inputs");

				const exitCode = await session.stop();

				expect(exitCode).toBe(0);
			}
		}));
});
