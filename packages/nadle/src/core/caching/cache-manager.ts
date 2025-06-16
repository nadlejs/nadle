import Path from "node:path";
import Fs from "node:fs/promises";

import { type FileSet } from "./file-set.js";
import { isPathExists } from "../fs-utils.js";
import { type CacheQuery } from "./cache-query.js";
import { type RunCacheMetadata, type TaskCacheMetadata } from "./metadata.js";

export class CacheManager {
	private static readonly META_FILE_NAME = "metadata.json";
	private static readonly CACHE_DIR_NAME = ".nadle";
	private static readonly TASKS_DIR_NAME = "tasks";
	private static readonly RUNS_DIR_NAME = "runs";
	private static readonly OUTPUTS_DIR_NAME = "outputs";

	constructor(private readonly baseDir: string) {}

	async hasCache(cacheQuery: CacheQuery): Promise<boolean> {
		return isPathExists(this.getRunMetadataPath(cacheQuery));
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

	async restoreOutputs(cacheQuery: CacheQuery, workingDir: string): Promise<void> {
		const basePath = this.getOutputBasePath(cacheQuery);

		const entries = await Fs.readdir(basePath, { recursive: true, withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isFile()) {
				continue;
			}

			const sourcePath = Path.join(entry.parentPath, entry.name);
			const targetPath = Path.join(workingDir, Path.relative(basePath, sourcePath));

			await Fs.mkdir(Path.dirname(targetPath), { recursive: true });
			await Fs.copyFile(sourcePath, targetPath);
		}
	}

	async saveOutputs(cacheQuery: CacheQuery, workingDir: string, outputs: FileSet): Promise<void> {
		const basePath = this.getOutputBasePath(cacheQuery);

		for (const sourcePath of outputs) {
			const relativePath = Path.relative(workingDir, sourcePath);
			const targetPath = Path.join(basePath, relativePath);

			await Fs.mkdir(Path.dirname(targetPath), { recursive: true });
			await Fs.copyFile(sourcePath, targetPath);
		}
	}

	private getOutputBasePath({ taskName, cacheKey }: CacheQuery): string {
		return Path.join(this.getBaseTaskPath(taskName), CacheManager.RUNS_DIR_NAME, cacheKey, CacheManager.OUTPUTS_DIR_NAME);
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

	async writeLatestRunMetadata({ taskName, cacheKey }: CacheQuery): Promise<void> {
		const path = this.getTaskMetadataPath(taskName);
		await Fs.mkdir(Path.dirname(path), { recursive: true });

		const taskCacheMetadata: TaskCacheMetadata = { latest: cacheKey };

		await Fs.writeFile(path, JSON.stringify(taskCacheMetadata, null, 2));
	}

	private getTaskMetadataPath(taskName: string): string {
		return Path.join(this.getBaseTaskPath(taskName), CacheManager.META_FILE_NAME);
	}

	private getBaseTaskPath(taskName: string) {
		return Path.join(this.baseDir, CacheManager.CACHE_DIR_NAME, CacheManager.TASKS_DIR_NAME, taskName);
	}
}
