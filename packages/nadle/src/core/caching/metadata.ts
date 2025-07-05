import { type CacheKey } from "./cache-key.js";
import { type FileFingerprints } from "./fingerprint.js";

export interface TaskCacheMetadata {
	/**
	 * The cache key of the latest run of the task.
	 */
	readonly latest: string;
}
export namespace TaskCacheMetadata {
	export function create(latestCacheKey: string): TaskCacheMetadata {
		return { latest: latestCacheKey };
	}
}

/**
 * Metadata stored for each cached task output.
 * Used to determine cache hits, restore outputs, and debug changes.
 */
export interface RunCacheMetadata {
	/**
	 * Version of the metadata schema.
	 * Allows backward compatibility and future migrations.
	 */
	version: 1;

	/**
	 * The id of the task this cache entry belongs to.
	 */
	taskId: string;

	/**
	 * Unique hash (cache key) for this task run,
	 * typically derived from task name, inputs, env, config, and dependency keys.
	 */
	cacheKey: string;

	/**
	 * ISO timestamp when the task completed and was cached.
	 */
	timestamp: string;

	/**
	 * A mapping of absolute file paths to their SHA-256 content hashes.
	 *
	 * This represents the full set of resolved input files for the task,
	 * after glob resolution and filtering (e.g., directories removed).
	 *
	 * Keys are absolute file paths,
	 * and values are stable content hashes used to detect changes.
	 */
	inputsFingerprints: FileFingerprints;

	/**
	 * The SHA-256 hash of the outputs produced by this task run.
	 */
	outputsFingerprint: string;

	/**
	 * Task-specific config or options (e.g., { minify: true }).
	 * Used in hash calculation to reflect changes in behavior.
	 */
	// config?: Record<string, any>;

	/**
	 * Cache keys of tasks this one depends on.
	 * Used to invalidate downstream tasks if dependencies change.
	 */
	// dependencies?: Record<string, string>;
}

export namespace RunCacheMetadata {
	export function create(params: {
		taskId: string;
		cacheKey: CacheKey;
		outputsFingerprint: string;
		inputsFingerprints: FileFingerprints;
	}): RunCacheMetadata {
		return { version: 1, timestamp: new Date().toISOString(), ...params };
	}
}
