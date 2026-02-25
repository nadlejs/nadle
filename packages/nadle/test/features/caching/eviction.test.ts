import Path from "node:path";
import Fs from "node:fs/promises";

import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { getStdout, withFixture, createFileModifier } from "setup";

describe.skipIf(isWindows)("cache eviction", () => {
	it("should evict old cache entries beyond maxCacheEntries", { timeout: 60_000 }, () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching-eviction",
			testFn: async ({ cwd, exec }) => {
				const fileModifier = createFileModifier(cwd);

				// Run 1: initial input → cache entry 1
				await expect(getStdout(exec`process`)).resolves.toSettle("process", "done");

				// Run 2: modify input → cache entry 2
				await fileModifier.apply([{ type: "modify", newContent: "second", path: "src/input.txt" }]);
				await expect(getStdout(exec`process`)).resolves.toSettle("process", "done");

				// Run 3: modify input again → cache entry 3 (should evict entry 1)
				await fileModifier.apply([{ type: "modify", newContent: "third", path: "src/input.txt" }]);
				await expect(getStdout(exec`process`)).resolves.toSettle("process", "done");

				const runsDir = Path.join(cwd, "node_modules", ".cache", "nadle", "tasks", "root_process", "runs");
				const entries = await Fs.readdir(runsDir);

				// maxCacheEntries is 2, so only 2 run directories should remain
				expect(entries.length).toBe(2);
			}
		})
	);
});
