export interface CacheKeyContext {
	readonly taskName: string;
	readonly inputs: string[];
}

/**
 * Metadata stored for each cached task output.
 * Used to determine cache hits, restore outputs, and debug changes.
 */
export interface CacheMetadata {
	/**
	 * Version of the metadata schema.
	 * Allows backward compatibility and future migrations.
	 */
	version: 1;

	/**
	 * Name of the task this cache entry belongs to.
	 */
	taskName: string;

	/**
	 * Unique hash (cache key) for this task run,
	 * typically derived from task name, inputs, env, config, and dependency keys.
	 */
	hash: string;

	/**
	 * ISO timestamp when the task completed and was cached.
	 */
	timestamp: string;

	/**
	 * List of input file paths or patterns that were used to compute the hash.
	 * These are typically files read by the task configurations
	 */
	inputs: string[];

	/**
	 * List of output file paths or directories produced by the task.
	 * These are copied into the cache and restored on cache hit.
	 */
	outputs: string[];

	/**
	 * Task-specific config or options (e.g., { minify: true }).
	 * Used in hash calculation to reflect changes in behavior.
	 */
	config?: Record<string, any>;

	/**
	 * Cache keys of tasks this one depends on.
	 * Used to invalidate downstream tasks if dependencies change.
	 */
	dependencies?: Record<string, string>;
}
