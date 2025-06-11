import Path from "node:path";
import Fs from "node:fs/promises";

import objectHash from "object-hash";

import type { CacheMetadata, CacheKeyContext } from "./types.js";

export class CacheManager {
	private static readonly META_FILE_NAME = "metadata.json";
	constructor(private readonly baseDir: string) {}

	computeCacheKey(context: CacheKeyContext): string {
		return objectHash(context, { encoding: "hex", algorithm: "sha256", unorderedArrays: true, unorderedObjects: true });
	}

	async hasCache(taskName: string, cacheKey: string): Promise<boolean> {
		const file = this.getMetadataPath(taskName, cacheKey);

		try {
			await Fs.access(file);

			return true;
		} catch {
			return false;
		}
	}

	async readMetadata(taskName: string, cacheKey: string): Promise<CacheMetadata | null> {
		const file = this.getMetadataPath(taskName, cacheKey);

		try {
			const raw = await Fs.readFile(file, "utf8");

			return JSON.parse(raw);
		} catch {
			return null;
		}
	}

	async writeMetadata(taskName: string, cacheKey: string, metadata: CacheMetadata): Promise<void> {
		const file = this.getMetadataPath(taskName, cacheKey);
		await Fs.mkdir(Path.dirname(file), { recursive: true });
		await Fs.writeFile(file, JSON.stringify(metadata, null, 2));
	}

	private getMetadataPath(taskName: string, cacheKey: string): string {
		return Path.join(this.baseDir, taskName, cacheKey, CacheManager.META_FILE_NAME);
	}
}
