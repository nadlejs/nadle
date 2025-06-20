import { withTemp } from "setup";
import { it, expect, describe } from "vitest";

import { CacheManager, type CacheKeyInput, type RunCacheMetadata } from "../../../src/core/caching/index.js";

describe.skip("CacheManager", () => {
	describe("getCacheKey", () => {
		it("should return a cache key based on the inputs", async () => {
			const cacheManager = new CacheManager("/");

			const context: CacheKeyInput = {
				taskName: "build",
				inputsFingerprints: ["package.json", "tsconfig.json", "src/index.ts"]
			};

			expect(cacheManager.computeCacheKey(context)).toMatch(/^[a-f0-9]{64}$/);
		});

		it("should return the same cache key for the same inputs even in different order", async () => {
			const cacheManager = new CacheManager("/");

			const context: CacheKeyInput = {
				taskName: "build",
				inputsFingerprints: ["package.json", "tsconfig.json", "src/index.ts"]
			};

			const key1 = cacheManager.computeCacheKey(context);
			const key2 = cacheManager.computeCacheKey(context);

			expect(key1).toBe(key2);

			const context2: CacheKeyInput = {
				inputsFingerprints: ["src/index.ts", "tsconfig.json", "package.json"],
				// eslint-disable-next-line perfectionist/sort-objects
				taskName: "build"
			};

			const key3 = cacheManager.computeCacheKey(context2);

			expect(key3).toBe(key1);
		});
	});

	describe("read/write metadata", () => {
		it("should write and read metadata correctly", async () => {
			await withTemp({
				preserve: true,
				testFn: async ({ cwd }) => {
					const cacheManager = new CacheManager(cwd);

					const taskName = "build";
					const cacheKey = "1234567890".repeat(7).slice(0, 64);
					const metadata: RunCacheMetadata = {
						version: 1,
						taskName: "build",
						cacheKey: cacheKey,
						timestamp: new Date().toISOString(),
						inputsFingerprints: ["src/index.ts"],
						outputsFingerprint: ["lib/index.js"]
					};

					await cacheManager.writeRunMetadata(taskName, cacheKey, metadata);
					const readMetadata = await cacheManager.readRunMetadata(taskName, cacheKey);

					expect(readMetadata).toEqual(metadata);
					await expect(cacheManager.hasCache(taskName, cacheKey)).resolves.toBe(true);
				}
			});
		});

		it("should return null for non-existing metadata", async () => {
			const cacheManager = new CacheManager("/tmp/cache");

			const taskName = "build";
			const cacheKey = "non-existing-cache-key";

			const readMetadata = await cacheManager.readRunMetadata(taskName, cacheKey);

			expect(readMetadata).toBeNull();
			await expect(cacheManager.hasCache(taskName, cacheKey)).resolves.toBe(false);
		});
	});
});
