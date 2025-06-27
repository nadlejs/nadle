import Path from "node:path";
import Fs from "node:fs/promises";

import fg from "fast-glob";
import { createExec, fixturesDir } from "setup";
import { it, expect, describe, afterEach } from "vitest";

import { isPathExists } from "../../src/core/utilities/fs.js";

const cwd = Path.join(fixturesDir, "clean-cache");
const DEFAULT_CACHE_DIR = ".nadle";
const CUSTOM_CACHE_DIR = ".nadle-custom";

const cacheDirNames = [DEFAULT_CACHE_DIR, CUSTOM_CACHE_DIR];

describe("--clean-cache", () => {
	afterEach(async () => {
		for (const dir of await fg(`./*/{.nadle,.nadle-custom}`, { cwd: cwd, absolute: true, onlyDirectories: true })) {
			await Fs.rm(dir, { force: true, recursive: true });
		}
	});
	const exec = createExec({ cwd });

	describe("given the default cache directory", () => {
		it("should remove the cache directory", async () => {
			for (const cacheDirName of cacheDirNames) {
				await expect(isPathExists(Path.join(cwd, cacheDirName))).resolves.toBe(false);
			}

			await exec`build`;

			await expect(isPathExists(Path.join(cwd, DEFAULT_CACHE_DIR))).resolves.toBe(true);

			await createExec({ cwd })`--clean-cache`;

			await expect(isPathExists(Path.join(cwd, DEFAULT_CACHE_DIR))).resolves.toBe(false);
		});
	});

	describe("given the custom cache directory", () => {
		it("should remove the cache directory", async () => {
			for (const cacheDirName of cacheDirNames) {
				await expect(isPathExists(Path.join(cwd, cacheDirName))).resolves.toBe(false);
			}

			await exec`build --cache-dir ${CUSTOM_CACHE_DIR}`;

			await expect(isPathExists(Path.join(cwd, CUSTOM_CACHE_DIR))).resolves.toBe(true);

			await createExec({ cwd })`--clean-cache --cache-dir ${CUSTOM_CACHE_DIR}`;

			await expect(isPathExists(Path.join(cwd, CUSTOM_CACHE_DIR))).resolves.toBe(false);
		});
	});
});
