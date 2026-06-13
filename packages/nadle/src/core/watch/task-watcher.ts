export interface WatchSubscription {
	close(): Promise<void>;
}

/** Subscribe to file changes for the given paths; invoke onChange on each raw event. */
export type WatcherSubscribe = (paths: string[], onChange: () => void) => WatchSubscription;

export interface TaskWatcherOptions {
	readonly debounceMs?: number;
	/** Injectable for tests; defaults to a chokidar-backed subscription. */
	readonly subscribe?: WatcherSubscribe;
}

const DEFAULT_DEBOUNCE_MS = 100;

/**
 * Wraps a file watcher with three behaviors the watch loop needs:
 * - debounce: collapse a burst of raw events into one signal,
 * - serialize: never run two cycles concurrently,
 * - coalesce: if changes arrive during a run, schedule exactly one follow-up.
 */
export class TaskWatcher {
	private subscription: WatchSubscription | null = null;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private running = false;
	private pending = false;
	private run: (() => Promise<void>) | null = null;

	public constructor(
		private readonly paths: string[],
		private readonly options: TaskWatcherOptions = {}
	) {}

	public start(run: () => Promise<void>): void {
		this.run = run;

		const subscribe = this.options.subscribe ?? chokidarSubscribe;
		this.subscription = subscribe(this.paths, () => this.onRawChange());
	}

	private onRawChange(): void {
		const debounceMs = this.options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

		if (this.timer) {
			clearTimeout(this.timer);
		}

		this.timer = setTimeout(() => {
			this.timer = null;
			void this.trigger();
		}, debounceMs);
	}

	private async trigger(): Promise<void> {
		if (this.running) {
			this.pending = true;

			return;
		}

		this.running = true;

		try {
			await this.run?.();
		} finally {
			this.running = false;
		}

		if (this.pending) {
			this.pending = false;
			await this.trigger();
		}
	}

	public async close(): Promise<void> {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		await this.subscription?.close();
		this.subscription = null;
	}
}

const chokidarSubscribe: WatcherSubscribe = (paths, onChange) => {
	// Dynamic import keeps chokidar off the non-watch startup path.
	const watcherPromise = import("chokidar").then(({ watch }) =>
		watch(paths, { ignoreInitial: true, awaitWriteFinish: { pollInterval: 20, stabilityThreshold: 100 } }).on("all", () => onChange())
	);

	return {
		close: async () => {
			const watcher = await watcherPromise;
			await watcher.close();
		}
	};
};
