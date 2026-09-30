import { it, vi, expect, describe } from "vitest";

import { TaskWatcher } from "../../src/core/watch/task-watcher.js";

// A fake subscribe fn: captures the emit callback so the test can fire changes,
// and records close() calls. Matches the WatcherSubscribe signature.
function createFakeWatcher() {
	let emit: () => void = () => {};

	const closed = { value: false };
	const subscribe = (_paths: string[], onChange: () => void) => {
		emit = onChange;

		return { close: async () => void (closed.value = true) };
	};

	return { closed, subscribe, fire: () => emit() };
}

describe("TaskWatcher", () => {
	it("debounces a burst of changes into a single run", async () => {
		vi.useFakeTimers();
		const fake = createFakeWatcher();
		const run = vi.fn(async () => {});
		const watcher = new TaskWatcher(["a"], { debounceMs: 100, subscribe: fake.subscribe });

		watcher.start(run);
		fake.fire();
		fake.fire();
		fake.fire();
		await vi.advanceTimersByTimeAsync(100);

		expect(run).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});

	it("coalesces changes during an in-flight run into one follow-up run", async () => {
		vi.useFakeTimers();
		const fake = createFakeWatcher();
		let release: () => void = () => {};

		const run = vi
			.fn()
			.mockImplementationOnce(() => new Promise<void>((resolve) => (release = resolve)))
			.mockImplementation(async () => {});
		const watcher = new TaskWatcher(["a"], { debounceMs: 0, subscribe: fake.subscribe });

		watcher.start(run);
		fake.fire();
		await vi.advanceTimersByTimeAsync(0); // first run starts, now in-flight
		fake.fire();
		fake.fire(); // two changes while run #1 is in-flight
		await vi.advanceTimersByTimeAsync(0);
		release(); // finish run #1
		await vi.advanceTimersByTimeAsync(0);

		expect(run).toHaveBeenCalledTimes(2); // one in-flight + one coalesced follow-up
		vi.useRealTimers();
	});

	it("close() closes the underlying watcher", async () => {
		const fake = createFakeWatcher();
		const watcher = new TaskWatcher(["a"], { debounceMs: 0, subscribe: fake.subscribe });

		watcher.start(vi.fn(async () => {}));
		await watcher.close();

		expect(fake.closed.value).toBe(true);
	});
});
