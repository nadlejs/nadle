import Path from "node:path";
import Fs from "node:fs/promises";

import { isFileExists } from "../fs-utils.js";
import { type CacheQuery } from "./cache-query.js";
import { type RunCacheMetadata, type TaskCacheMetadata } from "./metadata.js";

export class CacheManager {
	private static readonly META_FILE_NAME = "metadata.json";
	private static readonly CACHE_DIR_NAME = ".nadle";
	private static readonly TASKS_DIR_NAME = "tasks";
	private static readonly RUNS_DIR_NAME = "runs";

	constructor(private readonly baseDir: string) {}

	async hasCache(cacheQuery: CacheQuery): Promise<boolean> {
		return isFileExists(this.getRunMetadataPath(cacheQuery));
	}

	async readRunMetadata(cacheQuery: CacheQuery): Promise<RunCacheMetadata | null> {
		const path = this.getRunMetadataPath(cacheQuery);

		try {
			const raw = await Fs.readFile(path, "utf8");

			return JSON.parse(raw);
		} catch {
			return null;
		}
	}

	async writeRunMetadata(cacheQuery: CacheQuery, metadata: RunCacheMetadata): Promise<void> {
		const file = this.getRunMetadataPath(cacheQuery);
		await Fs.mkdir(Path.dirname(file), { recursive: true });

		const { version, taskName, cacheKey, timestamp, ...rest } = metadata;

		await Fs.writeFile(file, JSON.stringify({ version, taskName, cacheKey, timestamp, ...rest }, null, 2));
		await this.writeLatestRunMetadata(cacheQuery);
	}

	private getRunMetadataPath({ taskName, cacheKey }: CacheQuery): string {
		return Path.join(this.getBaseTaskPath(taskName), CacheManager.RUNS_DIR_NAME, cacheKey, CacheManager.META_FILE_NAME);
	}

	async writeLatestRunMetadata({ taskName, cacheKey }: CacheQuery): Promise<void> {
		const path = this.getTaskMetadataPath(taskName);
		await Fs.mkdir(Path.dirname(path), { recursive: true });

		const taskCacheMetadata: TaskCacheMetadata = { latest: cacheKey };

		await Fs.writeFile(path, JSON.stringify(taskCacheMetadata, null, 2));
	}

	async readLatestRunMetadata(taskName: string): Promise<RunCacheMetadata | null> {
		const file = this.getTaskMetadataPath(taskName);

		try {
			const raw = await Fs.readFile(file, "utf8");

			const { latest } = JSON.parse(raw) as TaskCacheMetadata;

			return this.readRunMetadata({ taskName, cacheKey: latest });
		} catch {
			return null;
		}
	}

	private getTaskMetadataPath(taskName: string): string {
		return Path.join(this.getBaseTaskPath(taskName), CacheManager.META_FILE_NAME);
	}

	private getBaseTaskPath(taskName: string) {
		return Path.join(this.baseDir, CacheManager.CACHE_DIR_NAME, CacheManager.TASKS_DIR_NAME, taskName);
	}
}
