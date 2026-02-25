import Path from "node:path";
import Fs from "node:fs/promises";

import { isPathExists } from "../utilities/fs.js";
import { stringify } from "../utilities/stringify.js";
import { mapWithLimit } from "../utilities/concurrency.js";
import { COLON, UNDERSCORE } from "../utilities/constants.js";
import { atomicWriteFile } from "../utilities/atomic-write.js";
import { type CacheQuery } from "../models/cache/cache-key.js";
import { type TaskIdentifier } from "../models/task-identifier.js";
import { TaskCacheMetadata, type RunCacheMetadata } from "../models/cache/cache-metadata.js";

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
		} catch (error) {
			if (isFileNotFoundError(error) || error instanceof SyntaxError) {
				return null;
			}

			throw error;
		}
	}

	public async writeRunMetadata(cacheQuery: CacheQuery, metadata: RunCacheMetadata): Promise<void> {
		const file = this.getRunMetadataPath(cacheQuery);
		await Fs.mkdir(Path.dirname(file), { recursive: true });

		const { taskId, version, cacheKey, timestamp, ...rest } = metadata;

		await atomicWriteFile(file, stringify({ taskId, version, cacheKey, timestamp, ...rest }));
		await this.writeLatestRunMetadata(cacheQuery);
	}

	private getRunMetadataPath({ taskId, cacheKey }: CacheQuery): string {
		return Path.join(this.getBaseTaskPath(taskId), CacheManager.RUNS_DIR_NAME, cacheKey, CacheManager.META_FILE_NAME);
	}

	public async restoreOutputs(cacheQuery: CacheQuery): Promise<void> {
		const outputsCacheDir = this.getOutputsCacheDirPath(cacheQuery);

		const entries = await Fs.readdir(outputsCacheDir, { recursive: true, withFileTypes: true });

		const filePairs = entries
			.filter((entry) => entry.isFile())
			.map((entry) => {
				const sourcePath = Path.join(entry.parentPath, entry.name);
				const targetPath = Path.join(this.projectDir, Path.relative(outputsCacheDir, sourcePath));

				return { sourcePath, targetPath };
			});

		await ensureDirectories(filePairs.map(({ targetPath }) => Path.dirname(targetPath)));
		await mapWithLimit(filePairs, ({ sourcePath, targetPath }) => Fs.copyFile(sourcePath, targetPath));
	}

	public async saveOutputs(cacheQuery: CacheQuery, outputPaths: string[]): Promise<void> {
		const outputsCacheDir = this.getOutputsCacheDirPath(cacheQuery);

		const filePairs = outputPaths.map((sourcePath) => {
			const targetPath = Path.join(outputsCacheDir, Path.relative(this.projectDir, sourcePath));

			return { sourcePath, targetPath };
		});

		await ensureDirectories(filePairs.map(({ targetPath }) => Path.dirname(targetPath)));
		await mapWithLimit(filePairs, ({ sourcePath, targetPath }) => Fs.copyFile(sourcePath, targetPath));
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
		} catch (error) {
			if (isFileNotFoundError(error) || error instanceof SyntaxError) {
				return null;
			}

			throw error;
		}
	}

	public async writeLatestRunMetadata({ taskId, cacheKey }: CacheQuery): Promise<void> {
		const path = this.getTaskMetadataPath(taskId);
		await Fs.mkdir(Path.dirname(path), { recursive: true });

		await atomicWriteFile(path, stringify(TaskCacheMetadata.create(cacheKey)));
	}

	public async evict(taskId: TaskIdentifier, maxCacheEntries: number): Promise<void> {
		if (maxCacheEntries <= 0) {
			return;
		}

		const runsDir = Path.join(this.getBaseTaskPath(taskId), CacheManager.RUNS_DIR_NAME);

		if (!(await isPathExists(runsDir))) {
			return;
		}

		const entries = await Fs.readdir(runsDir, { withFileTypes: true });
		const runDirs = entries.filter((e) => e.isDirectory());

		if (runDirs.length <= maxCacheEntries) {
			return;
		}

		const latestMeta = await this.readTaskMetadata(taskId);
		const runs = await Promise.all(
			runDirs.map(async (dir) => {
				const metaPath = Path.join(runsDir, dir.name, CacheManager.META_FILE_NAME);

				try {
					const raw = await Fs.readFile(metaPath, "utf8");
					const meta = JSON.parse(raw) as RunCacheMetadata;

					return { dir: dir.name, timestamp: meta.timestamp };
				} catch {
					return { dir: dir.name, timestamp: "" };
				}
			})
		);

		runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

		const toDelete = runs.slice(maxCacheEntries).filter((r) => r.dir !== latestMeta);

		await Promise.all(toDelete.map((r) => Fs.rm(Path.join(runsDir, r.dir), { force: true, recursive: true }).catch(() => {})));
	}

	private async readTaskMetadata(taskId: TaskIdentifier): Promise<string | null> {
		try {
			const raw = await Fs.readFile(this.getTaskMetadataPath(taskId), "utf8");

			return (JSON.parse(raw) as TaskCacheMetadata).latest;
		} catch {
			return null;
		}
	}

	private getTaskMetadataPath(taskId: TaskIdentifier): string {
		return Path.join(this.getBaseTaskPath(taskId), CacheManager.META_FILE_NAME);
	}

	private getBaseTaskPath(taskId: TaskIdentifier) {
		return Path.join(this.cacheDir, CacheManager.TASKS_DIR_NAME, taskId.replaceAll(COLON, UNDERSCORE));
	}
}

async function ensureDirectories(dirs: string[]): Promise<void> {
	const unique = [...new Set(dirs)];

	await Promise.all(unique.map((dir) => Fs.mkdir(dir, { recursive: true })));
}

function isFileNotFoundError(error: unknown): boolean {
	return error instanceof Error && "code" in error && error.code === "ENOENT";
}
