import Path from "node:path";
import Fs from "node:fs/promises";

import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { getStdout, withFixture, createFileModifier } from "setup";

async function countRuns(cwd: string, task: string): Promise<number> {
	try {
		const content = await Fs.readFile(Path.join(cwd, `${task}.runs`), "utf-8");

		return content.trim().split("\n").filter(Boolean).length;
	} catch {
		return 0;
	}
}

describe.skipIf(isWindows).concurrent("verdict caching", () => {
	it("should execute in the first run", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-verdict",
			testFn: async ({ cwd, exec }) => {
				await expect(getStdout(exec`lint`)).resolves.toSettle("lint", "done");
				await expect(countRuns(cwd, "lint")).resolves.toBe(1);
			}
		}));

	it("should be up-to-date in the second run if inputs do not change", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-verdict",
			testFn: async ({ cwd, exec }) => {
				await exec`lint`;

				await expect(getStdout(exec`lint`)).resolves.toSettle("lint", "up-to-date");
				await expect(countRuns(cwd, "lint")).resolves.toBe(1);
			}
		}));

	it("should re-execute in the second run if inputs change", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-verdict",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				await exec`lint`;
				await fileModifier.apply([{ type: "modify", newContent: "changed", path: "sources/main.txt" }]);

				await expect(getStdout(exec`lint`)).resolves.toSettle("lint", "done");
				await expect(countRuns(cwd, "lint")).resolves.toBe(2);
			}
		}));

	it("should not cache a failing task", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-verdict",
			testFn: async ({ cwd, exec }) => {
				await expect(exec`failing-lint`).rejects.toThrow();
				await expect(exec`failing-lint`).rejects.toThrow();

				await expect(countRuns(cwd, "failing-lint")).resolves.toBe(2);
			}
		}));

	it("should not cache an inputs-only task without the opt-in", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-verdict",
			testFn: async ({ cwd, exec }) => {
				await exec`uncached-lint`;

				await expect(getStdout(exec`uncached-lint`)).resolves.toSettle("uncached-lint", "done");
				await expect(countRuns(cwd, "uncached-lint")).resolves.toBe(2);
			}
		}));

	it("should explain the verdict hit under --why", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-verdict",
			testFn: async ({ exec }) => {
				await exec`lint`;

				await expect(getStdout(exec`lint --why`)).resolves.toContain("inputs unchanged since it last passed");
			}
		}));

	it("should name the missing outputs under --why for a never-cached task", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-verdict",
			testFn: async ({ exec }) => {
				await expect(getStdout(exec`uncached-lint --why`)).resolves.toContain("declares inputs but no outputs");
			}
		}));
});
