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
