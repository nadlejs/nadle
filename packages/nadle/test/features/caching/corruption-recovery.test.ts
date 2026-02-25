import Path from "node:path";
import Fs from "node:fs/promises";

import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { getStdout, withFixture } from "setup";

const CACHE_TASK_DIR = Path.join("node_modules", ".cache", "nadle", "tasks", "root_bundle-resources");

describe.skipIf(isWindows)("cache corruption recovery", () => {
	it("should re-execute when task metadata is corrupted", { timeout: 60_000 }, () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "up-to-date");

				const taskMetaPath = Path.join(cwd, CACHE_TASK_DIR, "metadata.json");
				await Fs.writeFile(taskMetaPath, "{ invalid json");

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
			}
		})
	);

	it("should re-execute when run metadata is corrupted", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");

				const runsDir = Path.join(cwd, CACHE_TASK_DIR, "runs");
				const runDirs = await Fs.readdir(runsDir);

				for (const runDir of runDirs) {
					const metaPath = Path.join(runsDir, runDir, "metadata.json");
					await Fs.writeFile(metaPath, "not valid json!");
				}

				await expect(getStdout(exec`bundle-resources`)).resolves.toSettle("bundle-resources", "done");
			}
		}));
});
