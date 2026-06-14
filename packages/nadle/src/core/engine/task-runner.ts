/**
 * Runs a task attempt with optional per-attempt timeout and retry budget.
 *
 * - Each attempt is bounded by `timeout` (ms) when set; an over-time attempt rejects
 *   with a timeout error (the underlying work is not forcibly interrupted).
 * - On failure the attempt is retried up to `retries` additional times. The last
 *   error is thrown if every attempt fails.
 */
export async function runWithRetries(run: () => Promise<void>, options: { retries: number; timeout: number | undefined }): Promise<void> {
	let lastError: unknown;

	for (let attempt = 0; attempt <= options.retries; attempt++) {
		try {
			await runAttempt(run, options.timeout);

			return;
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError;
}

function runAttempt(run: () => Promise<void>, timeout: number | undefined): Promise<void> {
	const result = run();

	if (timeout === undefined) {
		return result;
	}

	return new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`Task timed out after ${timeout}ms.`)), timeout);

		result.then(
			() => {
				clearTimeout(timer);
				resolve();
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			}
		);
	});
}
