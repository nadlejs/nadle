import Path from "node:path";
import Fs from "node:fs/promises";

import fg from "fast-glob";
import { createExec, fixturesDir } from "setup";
import { it, expect, describe, afterEach } from "vitest";

import { isPathExists } from "../../src/core/utilities/fs.js";

const baseDir = Path.join(fixturesDir, "cache-dir");
const DEFAULT_CACHE_DIR = ".nadle";
const VIA_FILE_CACHE_DIR = ".nadle-custom-by-file";
const VIA_CLI_CACHE_DIR = ".nadle-custom-by-cli";

const cacheDirNames = [DEFAULT_CACHE_DIR, VIA_FILE_CACHE_DIR, VIA_CLI_CACHE_DIR];

const testCases = [
	{ withCLI: true, fixtureDir: "with-config", expectedCacheDir: VIA_CLI_CACHE_DIR },
	{ withCLI: true, fixtureDir: "without-config", expectedCacheDir: VIA_CLI_CACHE_DIR },
	{ withCLI: false, fixtureDir: "with-config", expectedCacheDir: VIA_FILE_CACHE_DIR },
	{ withCLI: false, fixtureDir: "without-config", expectedCacheDir: DEFAULT_CACHE_DIR }
];

describe("--cache-dir", () => {
	afterEach(async () => {
		for (const dir of await fg(`./*/{dist,${cacheDirNames.join(",")}}`, { cwd: baseDir, absolute: true, onlyDirectories: true })) {
			await Fs.rm(dir, { force: true, recursive: true });
		}
	});

	describe.each(testCases)("given $fixtureDir fixture, when run build with --cache-dir = $withCLI", ({ withCLI, fixtureDir, expectedCacheDir }) => {
		it(`should create the ${expectedCacheDir} cache directory`, async () => {
			const cwd = Path.join(fixturesDir, "cache-dir", fixtureDir);

			for (const cacheDirName of cacheDirNames) {
				await expect(isPathExists(Path.join(cwd, cacheDirName))).resolves.toBe(false);
			}

			await createExec({ cwd })`build ${withCLI ? "--cache-dir " + VIA_CLI_CACHE_DIR : ""}`;

			await expect(isPathExists(Path.join(cwd, expectedCacheDir))).resolves.toBe(true);

			for (const cacheDirName of cacheDirNames) {
				if (cacheDirName !== expectedCacheDir) {
					// eslint-disable-next-line vitest/no-conditional-expect
					await expect(isPathExists(Path.join(cwd, cacheDirName))).resolves.toBe(false);
				}
			}
		});
	});
});
