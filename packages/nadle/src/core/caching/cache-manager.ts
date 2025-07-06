import Path from "node:path";
import Fs from "node:fs/promises";

import { isPathExists } from "../utilities/fs.js";
import { type CacheQuery } from "./cache-query.js";
import { COLON, UNDERSCORE } from "../utilities/constants.js";
import { type TaskIdentifier } from "../registration/task-identifier.js";
import { type RunCacheMetadata, type TaskCacheMetadata } from "./metadata.js";

export class CacheManager {
	private static readonly RUNS_DIR_NAME = "runs";
	private static readonly TASKS_DIR_NAME = "tasks";
	private static readonly OUTPUTS_DIR_NAME = "outputs";
	private static readonly META_FILE_NAME = "metadata.json";

	public constructor(
		private readonly projectDir: string,
		private readonly cacheDir: string
	) {}

	public async hasCache(cacheQuery: CacheQuery): Promise<boolean> {
		return isPathExists(this.getRunMetadataPath(cacheQuery));
	}

	public async readRunMetadata(cacheQuery: CacheQuery): Promise<RunCacheMetadata | null> {
		const path = this.getRunMetadataPath(cacheQuery);

		try {
			const raw = await Fs.readFile(path, "utf8");

			return JSON.parse(raw);
		} catch {
			return null;
		}
	}

	public async writeRunMetadata(cacheQuery: CacheQuery, metadata: RunCacheMetadata): Promise<void> {
		const file = this.getRunMetadataPath(cacheQuery);
		await Fs.mkdir(Path.dirname(file), { recursive: true });

		const { taskId, version, cacheKey, timestamp, ...rest } = metadata;

		await Fs.writeFile(file, JSON.stringify({ taskId, version, cacheKey, timestamp, ...rest }, null, 2));
		await this.writeLatestRunMetadata(cacheQuery);
	}

	private getRunMetadataPath({ taskId, cacheKey }: CacheQuery): string {
		return Path.join(this.getBaseTaskPath(taskId), CacheManager.RUNS_DIR_NAME, cacheKey, CacheManager.META_FILE_NAME);
	}

	public async restoreOutputs(cacheQuery: CacheQuery): Promise<void> {
		const outputsCacheDir = this.getOutputsCacheDirPath(cacheQuery);

		const entries = await Fs.readdir(outputsCacheDir, { recursive: true, withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isFile()) {
				continue;
			}

			const sourcePath = Path.join(entry.parentPath, entry.name);
			const targetPath = Path.join(this.projectDir, Path.relative(outputsCacheDir, sourcePath));

			await Fs.mkdir(Path.dirname(targetPath), { recursive: true });
			await Fs.copyFile(sourcePath, targetPath);
		}
	}

	public async saveOutputs(cacheQuery: CacheQuery, outputPaths: string[]): Promise<void> {
		const outputsCacheDir = this.getOutputsCacheDirPath(cacheQuery);

		for (const sourcePath of outputPaths) {
			const relativePath = Path.relative(this.projectDir, sourcePath);
			const targetPath = Path.join(outputsCacheDir, relativePath);

			await Fs.mkdir(Path.dirname(targetPath), { recursive: true });
			await Fs.copyFile(sourcePath, targetPath);
		}
	}

	private getOutputsCacheDirPath({ taskId, cacheKey }: CacheQuery): string {
		return Path.join(this.getBaseTaskPath(taskId), CacheManager.RUNS_DIR_NAME, cacheKey, CacheManager.OUTPUTS_DIR_NAME);
	}

	public async readLatestRunMetadata(taskId: TaskIdentifier): Promise<RunCacheMetadata | null> {
		const file = this.getTaskMetadataPath(taskId);

		try {
			const raw = await Fs.readFile(file, "utf8");

			const { latest } = JSON.parse(raw) as TaskCacheMetadata;

			return this.readRunMetadata({ taskId, cacheKey: latest });
		} catch {
			return null;
		}
	}

	public async writeLatestRunMetadata({ taskId, cacheKey }: CacheQuery): Promise<void> {
		const path = this.getTaskMetadataPath(taskId);
		await Fs.mkdir(Path.dirname(path), { recursive: true });

		const taskCacheMetadata: TaskCacheMetadata = { latest: cacheKey };

		await Fs.writeFile(path, JSON.stringify(taskCacheMetadata, null, 2));
	}

	private getTaskMetadataPath(taskId: TaskIdentifier): string {
		return Path.join(this.getBaseTaskPath(taskId), CacheManager.META_FILE_NAME);
	}

	private getBaseTaskPath(taskId: TaskIdentifier) {
		return Path.join(this.cacheDir, CacheManager.TASKS_DIR_NAME, taskId.replaceAll(COLON, UNDERSCORE));
	}
}
