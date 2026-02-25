const DEFAULT_CONCURRENCY = 64;

export async function mapWithLimit<T>(items: T[], fn: (item: T) => Promise<void>, limit = DEFAULT_CONCURRENCY): Promise<void> {
	let index = 0;

	async function next(): Promise<void> {
		while (index < items.length) {
			const current = index++;
			await fn(items[current]);
		}
	}

	const workers = Array.from({ length: Math.min(limit, items.length) }, () => next());
	await Promise.all(workers);
}
