# Watch Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `nadle <tasks...> --watch` that runs the requested tasks once, then re-runs them through the normal scheduler + cache whenever any declared `inputs` change, until Ctrl-C.

**Architecture:** A `--watch` boolean flag selects a new `WatchHandler` (registered before `ExecuteHandler`). The handler resolves the requested tasks' (and their dependencies') `inputs` declarations to concrete paths, runs an initial build via the existing scheduler+`TaskPool` path, then drives re-runs from a `TaskWatcher` (a chokidar wrapper that debounces, serializes, and coalesces change events). The cache prunes unaffected tasks on each cycle.

**Tech Stack:** TypeScript (ESM, node22), chokidar (new runtime dep, dynamically imported on the watch path only), vitest integration tests via execa.

---

## File Structure

- `packages/nadle/src/core/options/types.ts` — add `watch?: boolean` to `NadleCLIOptions`.
- `packages/nadle/src/core/options/cli-options.ts` — add the `watch` flag definition.
- `packages/nadle/src/core/options/options-resolver.ts` — default `watch: false`.
- `packages/nadle/src/cli.ts` — register `watch` in `.options()` and the Execution group.
- `packages/nadle/src/core/watch/task-watcher.ts` — **new** chokidar wrapper (debounce/serialize/coalesce).
- `packages/nadle/src/core/handlers/watch-handler.ts` — **new** orchestrating handler.
- `packages/nadle/src/core/handlers/index.ts` — register `WatchHandler`.
- `packages/nadle/package.json` — add `chokidar` dependency.
- `packages/nadle/test/__setup__/watch.ts` — **new** test helper (spawn watch, await marker, kill).
- `packages/nadle/test/__setup__/index.ts` — re-export the watch helper.
- `packages/nadle/test/options/watch.test.ts` — **new** integration tests.
- `packages/docs/docs/config-reference.md` — document `--watch`.

---

## Task 1: Add the `--watch` flag (no behavior yet)

**Files:**

- Modify: `packages/nadle/src/core/options/types.ts`
- Modify: `packages/nadle/src/core/options/cli-options.ts`
- Modify: `packages/nadle/src/core/options/options-resolver.ts`
- Modify: `packages/nadle/src/cli.ts`

- [ ] **Step 1: Add `watch` to `NadleCLIOptions`**

In `packages/nadle/src/core/options/types.ts`, find the block with `dryRun` / `graph` / `why` and add after the `why` line:

```ts
	/** Re-run the requested tasks whenever their declared inputs change. */
	readonly watch?: boolean;
```

- [ ] **Step 2: Add the CLI flag definition**

In `packages/nadle/src/core/options/cli-options.ts`, add a `watch` entry next to `dryRun` (in the `CLIOptions` object):

```ts
	watch: {
		key: "watch",
		options: {
			alias: "w",
			default: false,
			type: "boolean",
			description: "Re-run the requested tasks when their inputs change"
		}
	},
```

- [ ] **Step 3: Default `watch` in the resolver**

In `packages/nadle/src/core/options/options-resolver.ts`, in the `defaultOptions` object, add after `why: false,`:

```ts
		watch: false,
```

- [ ] **Step 4: Register the flag in yargs**

In `packages/nadle/src/cli.ts`, inside `.options({ ... })` add after the `dryRun` line:

```ts
		[CLIOptions.watch.key]: CLIOptions.watch.options,
```

And in the first `.group([...], "Execution options:")` array, add after `CLIOptions.dryRun.key,`:

```ts
			CLIOptions.watch.key,
```

- [ ] **Step 5: Typecheck**

Run: `nadle typecheck`
Expected: `RUN SUCCESSFUL` (no type errors). `watch?: boolean` is optional in `NadleCLIOptions` and supplied by the resolver default, so `Required<>` in `NadleResolvedOptions` is satisfied — same pattern as `summary`/`why`.

- [ ] **Step 6: Commit**

```bash
git add packages/nadle/src/core/options packages/nadle/src/cli.ts
git commit -m "feat: add --watch flag (no behavior yet)"
```

---

## Task 2: Add chokidar dependency

**Files:**

- Modify: `packages/nadle/package.json`

- [ ] **Step 1: Install chokidar**

Run: `pnpm --filter ./packages/nadle add chokidar`
Expected: `chokidar` appears under `dependencies` in `packages/nadle/package.json`, lockfile updated.

- [ ] **Step 2: Verify size-limit unaffected**

Run: `pnpm --filter ./packages/nadle exec size-limit`
Expected: PASS. chokidar is not imported by the default entry yet, so `lib/**` size is unchanged.

- [ ] **Step 3: Commit**

```bash
git add packages/nadle/package.json pnpm-lock.yaml
git commit -m "build: add chokidar dependency for watch mode"
```

---

## Task 3: `TaskWatcher` — chokidar wrapper with debounce/serialize/coalesce

**Files:**

- Create: `packages/nadle/src/core/watch/task-watcher.ts`
- Test: `packages/nadle/test/unit/task-watcher.test.ts`

This unit is pure orchestration logic around a watcher, so it is unit-tested with a fake emitter rather than real files. The chokidar import stays dynamic; the class accepts an injected `start` function so the test can drive change events directly.

- [ ] **Step 1: Write the failing test**

Create `packages/nadle/test/unit/task-watcher.test.ts`:

```ts
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

	return { subscribe, fire: () => emit(), closed };
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run --project nadle unit/task-watcher`
Expected: FAIL — `Cannot find module '../../src/core/watch/task-watcher.js'`.

- [ ] **Step 3: Implement `TaskWatcher`**

Create `packages/nadle/src/core/watch/task-watcher.ts`:

```ts
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
		watch(paths, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 20 } }).on("all", () => onChange())
	);

	return {
		close: async () => {
			const watcher = await watcherPromise;
			await watcher.close();
		}
	};
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run --project nadle unit/task-watcher`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/nadle/src/core/watch/task-watcher.ts packages/nadle/test/unit/task-watcher.test.ts
git commit -m "feat: add TaskWatcher (debounce, serialize, coalesce)"
```

---

## Task 4: `WatchHandler` — collect inputs, run loop

**Files:**

- Create: `packages/nadle/src/core/handlers/watch-handler.ts`
- Modify: `packages/nadle/src/core/handlers/index.ts`

No unit test here — the handler is covered by the Task 6 integration tests (it orchestrates the scheduler, pool, and watcher, which are integration concerns).

- [ ] **Step 1: Implement `WatchHandler`**

Create `packages/nadle/src/core/handlers/watch-handler.ts`:

```ts
import Path from "node:path";
import Process from "node:process";

import c from "tinyrainbow";
import { getWorkspaceById } from "@nadle/project-resolver";

import { TaskPool } from "../engine/task-pool.js";
import { BaseHandler } from "./base-handler.js";
import { Messages } from "../utilities/messages.js";
import { MaybeArray } from "../utilities/maybe-array.js";
import { TaskWatcher } from "../watch/task-watcher.js";
import { Declaration } from "../models/cache/declaration.js";
import { ResolvedTask } from "../interfaces/resolved-task.js";

export class WatchHandler extends BaseHandler {
	public readonly name = "watch";
	public readonly description = "Re-runs the requested tasks when their inputs change.";

	public canHandle(): boolean {
		return this.context.options.watch;
	}

	public async handle(): Promise<void> {
		if (this.context.options.tasks.length === 0) {
			this.context.logger.log(Messages.NoTasksFound());

			return;
		}

		const chosenTasks = this.context.options.tasks.map(ResolvedTask.getId);
		const scheduler = this.context.taskScheduler.init(chosenTasks);
		const watchPaths = await this.collectWatchPaths(scheduler.scheduledTask);

		if (watchPaths.length === 0) {
			this.context.logger.warn("No watchable inputs for the requested tasks — nothing to watch.");

			return;
		}

		const runOnce = async (): Promise<void> => {
			try {
				const sched = this.context.taskScheduler.init(chosenTasks);
				await this.context.eventEmitter.onTasksScheduled(sched.scheduledTask.map((taskId) => this.context.taskRegistry.getTaskById(taskId)));
				await new TaskPool(this.context, (taskId) => sched.getReadyTasks(taskId)).run();
			} catch (error) {
				// Watch mode never exits on a failed run — report and keep watching.
				this.context.logger.error(error instanceof Error ? error.message : String(error));
			}

			this.context.logger.log(c.dim("\nWatching for changes… (press Ctrl-C to exit)"));
		};

		await runOnce();

		const watcher = new TaskWatcher(watchPaths);
		watcher.start(runOnce);

		await new Promise<void>((resolve) => {
			const shutdown = () => {
				void watcher.close().then(resolve);
			};

			Process.once("SIGINT", shutdown);
			Process.once("SIGTERM", shutdown);
		});
	}

	private async collectWatchPaths(taskIds: string[]): Promise<string[]> {
		const paths = new Set<string>();

		for (const taskId of taskIds) {
			const task = this.context.taskRegistry.getTaskById(taskId);
			const config = task.configResolver();

			if (config.inputs === undefined) {
				continue;
			}

			const workspace = getWorkspaceById(this.context.options.project, task.workspaceId);
			const workingDir = Path.resolve(workspace.absolutePath, config.workingDir ?? "");

			for (const declaration of MaybeArray.toArray(config.inputs)) {
				for (const resolved of await Declaration.resolve(declaration, workingDir)) {
					paths.add(resolved);
				}
			}
		}

		// Config files invalidate everything — watch them too.
		const { rootWorkspace } = this.context.options.project;

		if (rootWorkspace.configFilePath) {
			paths.add(rootWorkspace.configFilePath);
		}

		return [...paths];
	}
}
```

- [ ] **Step 2: Register the handler**

In `packages/nadle/src/core/handlers/index.ts`, import and register `WatchHandler` before `ExecuteHandler`:

```ts
import { WatchHandler } from "./watch-handler.js";
```

Add `WatchHandler` to the `Handlers` array immediately before `ExecuteHandler`:

```ts
export const Handlers: HandlerConstructor[] = [
	ListHandler,
	ListWorkspacesHandler,
	CleanCacheHandler,
	GraphHandler,
	DryRunHandler,
	ShowConfigHandler,
	WatchHandler,
	ExecuteHandler
];
```

- [ ] **Step 3: Typecheck**

Run: `nadle typecheck`
Expected: `RUN SUCCESSFUL`. Verify `MaybeArray.toArray`, `Declaration.resolve`, and `getWorkspaceById` import paths resolve (they are used identically in `cache-validator.ts` and `worker.ts`).

- [ ] **Step 4: Build and smoke-test manually**

Run: `nadle bundle --no-cache`
Then, from a fixture dir with an input-declaring task:
Run: `cd packages/nadle/test/__fixtures__/caching && node ../../lib/cli.js bundle-resources --watch`
Expected: runs once, prints `Watching for changes…`, stays alive. Press Ctrl-C → exits.
(Manual only; automated coverage in Task 6.)

- [ ] **Step 5: Commit**

```bash
git add packages/nadle/src/core/handlers/watch-handler.ts packages/nadle/src/core/handlers/index.ts
git commit -m "feat: add WatchHandler driving the watch loop"
```

---

## Task 5: Watch test helper

**Files:**

- Create: `packages/nadle/test/__setup__/watch.ts`
- Modify: `packages/nadle/test/__setup__/index.ts`

- [ ] **Step 1: Implement the helper**

Create `packages/nadle/test/__setup__/watch.ts`:

```ts
import stripAnsi from "strip-ansi";
import { type ResultPromise } from "execa";

/**
 * Drive a long-lived `--watch` process: wait until `marker` appears in stdout
 * (resolves the accumulated output since the last wait), so a test can assert,
 * mutate a file, and wait again.
 */
export function watchSession(child: ResultPromise) {
	let buffer = "";
	child.stdout?.on("data", (chunk: Buffer) => (buffer += stripAnsi(chunk.toString())));

	async function waitFor(marker: string, timeoutMs = 15000): Promise<string> {
		const start = Date.now();

		while (Date.now() - start < timeoutMs) {
			if (buffer.includes(marker)) {
				const seen = buffer;
				buffer = "";

				return seen;
			}

			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		throw new Error(`Timed out waiting for "${marker}". Saw:\n${buffer}`);
	}

	async function stop(): Promise<number> {
		child.kill("SIGINT");

		try {
			const result = await child;

			return result.exitCode ?? 0;
		} catch (error) {
			return (error as { exitCode?: number }).exitCode ?? 1;
		}
	}

	return { waitFor, stop };
}
```

- [ ] **Step 2: Re-export from the setup barrel**

In `packages/nadle/test/__setup__/index.ts`, add:

```ts
export * from "./watch.js";
```

- [ ] **Step 3: Typecheck**

Run: `nadle typecheck`
Expected: `RUN SUCCESSFUL`.

- [ ] **Step 4: Commit**

```bash
git add packages/nadle/test/__setup__/watch.ts packages/nadle/test/__setup__/index.ts
git commit -m "test: add watchSession helper for --watch integration tests"
```

---

## Task 6: Watch integration tests

**Files:**

- Create: `packages/nadle/test/options/watch.test.ts`

The `caching` fixture's `bundle-resources` task declares `inputs`/`outputs` over `resources/`; reuse it. `createFileModifier` mutates fixture files. Marker for "run complete" is the `Watching for changes…` line printed by the handler after every cycle.

- [ ] **Step 1: Write the tests**

Create `packages/nadle/test/options/watch.test.ts`:

```ts
import { isWindows } from "std-env";
import { it, expect, describe } from "vitest";
import { watchSession, withFixture, createFileModifier } from "setup";

// Windows file-watching is the #420 risk area; start skipped there.
describe.skipIf(isWindows)("--watch", () => {
	it("runs once and then watches", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ exec }) => {
				const session = watchSession(exec`bundle-resources --watch`);

				const first = await session.waitFor("Watching for changes");

				expect(first).toContain("bundle-resources");

				const exitCode = await session.stop();

				expect(exitCode).toBe(0);
			}
		}));

	it("re-runs when a watched input changes", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "caching",
			testFn: async ({ cwd, exec }) => {
				const session = watchSession(exec`bundle-resources --watch`);
				await session.waitFor("Watching for changes");

				await createFileModifier(cwd).apply([{ type: "modify", newContent: "changed", path: "resources/main-input.txt" }]);

				const second = await session.waitFor("Watching for changes");

				expect(second).toContain("bundle-resources");

				await session.stop();
			}
		}));

	it("warns and exits when the task has no inputs", () =>
		withFixture({
			copyAll: true,
			fixtureDir: "main",
			testFn: async ({ exec }) => {
				const session = watchSession(exec`hello --watch`);

				const out = await session.waitFor("nothing to watch");

				expect(out).toContain("No watchable inputs");

				const exitCode = await session.stop();

				expect(exitCode).toBe(0);
			}
		}));
});
```

- [ ] **Step 2: Build, then run the tests**

Run: `nadle bundle --no-cache`
Run: `pnpm exec vitest run --project nadle options/watch`
Expected: PASS (3 tests). If the `main` fixture's `hello` task does not exist or already has inputs, adjust the third test to a task with no `inputs` declared (verify with `node packages/nadle/lib/cli.js --list` in the fixture).

- [ ] **Step 3: Commit**

```bash
git add packages/nadle/test/options/watch.test.ts
git commit -m "test: --watch integration tests"
```

---

## Task 7: Document `--watch`

**Files:**

- Modify: `packages/docs/docs/config-reference.md`

- [ ] **Step 1: Add the doc entry**

In `packages/docs/docs/config-reference.md`, after the `### \`--dry-run\``section (and before`### \`--graph\``), add:

````markdown
### `--watch`

- **Type:** `boolean`
- **Alias:** `-w`
- **Default:** `false`

Run the requested tasks, then keep running and re-run them whenever any of their
declared `inputs` change. Only tasks whose inputs actually changed re-execute;
the rest stay cached. Config files are watched too. Press Ctrl-C to exit. Tasks
with no declared `inputs` are not watchable.

```bash
nadle build --watch
```
````

````

- [ ] **Step 2: Spell-check passes**

Run: `nadle spell`
Expected: PASS (`chokidar` is not referenced in docs; no new words needed). If it fails on a new word, add it to `cspell.config.js`.

- [ ] **Step 3: Commit**

```bash
git add packages/docs/docs/config-reference.md
git commit -m "docs: document --watch flag"
````

---

## Task 8: Final verification

- [ ] **Step 1: Full check**

Run: `nadle check`
Expected: `RUN SUCCESSFUL` (spell, eslint, prettier, knip, validate). Fix any `perfectionist` ordering via `pnpm exec eslint . --fix` and reformat with `pnpm exec prettier --experimental-cli --write`.

- [ ] **Step 2: Typecheck + the touched test suites**

Run: `nadle typecheck`
Run: `pnpm exec vitest run --project nadle unit/task-watcher options/watch options/help options/show-config`
Expected: all PASS. If `--help`/`--show-config`/`--config-key` snapshots changed (the new `--watch` flag shows in help and resolved options), regenerate: `pnpm exec vitest run --project nadle options/help options/show-config options/config-key -u`, review the diff (should only add `--watch` / `"watch": false`), and commit.

- [ ] **Step 3: Size-limit still green**

Run: `pnpm --filter ./packages/nadle exec size-limit`
Expected: PASS. chokidar is dynamically imported, so the default-entry bundle shouldn't grow meaningfully; if it does, investigate before merging (a static import crept in).

- [ ] **Step 4: Commit any snapshot/format fixups**

```bash
git add -A
git commit -m "test: regenerate option-list snapshots for --watch"
```
