import Path from "node:path";

import { it, expect, describe } from "vitest";
import { createExec, withFixture } from "setup";

import { isPathExists } from "../../src/core/utilities/fs.js";

const DEFAULT_CACHE_DIR = ".nadle";
const CUSTOM_CACHE_DIR = ".nadle-custom";

const cacheDirNames = [DEFAULT_CACHE_DIR, CUSTOM_CACHE_DIR];

describe.concurrent("--clean-cache", () => {
	it("should remove the default cache directory", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "clean-cache",
			testFn: async ({ cwd, exec }) => {
				for (const cacheDirName of cacheDirNames) {
					await expect(isPathExists(Path.join(cwd, cacheDirName))).resolves.toBe(false);
				}

				await exec`build`;

				await expect(isPathExists(Path.join(cwd, DEFAULT_CACHE_DIR))).resolves.toBe(true);

				await createExec({ cwd })`--clean-cache`;

				await expect(isPathExists(Path.join(cwd, DEFAULT_CACHE_DIR))).resolves.toBe(false);
			}
		}));

	it("should remove the custom cache directory", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "clean-cache",
			testFn: async ({ cwd, exec }) => {
				for (const cacheDirName of cacheDirNames) {
					await expect(isPathExists(Path.join(cwd, cacheDirName))).resolves.toBe(false);
				}

				await exec`build --cache-dir ${CUSTOM_CACHE_DIR}`;

				await expect(isPathExists(Path.join(cwd, CUSTOM_CACHE_DIR))).resolves.toBe(true);

				await createExec({ cwd })`--clean-cache --cache-dir ${CUSTOM_CACHE_DIR}`;

				await expect(isPathExists(Path.join(cwd, CUSTOM_CACHE_DIR))).resolves.toBe(false);
			}
		}));
});
