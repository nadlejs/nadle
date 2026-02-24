import Path from "node:path";

import { withFixture } from "setup";
import { it, expect, describe } from "vitest";

import { isPathExists } from "../../src/core/utilities/fs.js";

const DEFAULT_CACHE_DIR = "node_modules/.cache/nadle";
const VIA_FILE_CACHE_DIR = ".nadle-custom-by-file";
const VIA_CLI_CACHE_DIR = ".nadle-custom-by-cli";

const cacheDirNames = [DEFAULT_CACHE_DIR, VIA_FILE_CACHE_DIR, VIA_CLI_CACHE_DIR];

const testCases = [
	{ withCLI: true, fixtureDir: "cache-dir/with-config", expectedCacheDir: VIA_CLI_CACHE_DIR },
	{ withCLI: true, expectedCacheDir: VIA_CLI_CACHE_DIR, fixtureDir: "cache-dir/without-config" },
	{ withCLI: false, fixtureDir: "cache-dir/with-config", expectedCacheDir: VIA_FILE_CACHE_DIR },
	{ withCLI: false, expectedCacheDir: DEFAULT_CACHE_DIR, fixtureDir: "cache-dir/without-config" }
];

describe.concurrent("--cache-dir", () => {
	describe.each(testCases)("given $fixtureDir fixture, when run build with --cache-dir = $withCLI", ({ withCLI, fixtureDir, expectedCacheDir }) => {
		it(`should create the ${expectedCacheDir} cache directory`, () =>
			withFixture({
				fixtureDir,
				copyAll: true,
				testFn: async ({ cwd, exec }) => {
					for (const cacheDirName of cacheDirNames) {
						await expect(isPathExists(Path.join(cwd, cacheDirName))).resolves.toBe(false);
					}

					await exec`build ${withCLI ? "--cache-dir " + VIA_CLI_CACHE_DIR : ""}`;

					await expect(isPathExists(Path.join(cwd, expectedCacheDir))).resolves.toBe(true);

					for (const cacheDirName of cacheDirNames) {
						if (cacheDirName !== expectedCacheDir) {
							// eslint-disable-next-line vitest/no-conditional-expect
							await expect(isPathExists(Path.join(cwd, cacheDirName))).resolves.toBe(false);
						}
					}
				}
			}));
	});
});
