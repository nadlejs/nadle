<!-- cspell:ignore agentic chdir -->

# Faster nadle tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut nadle test-suite wall-clock time by running tasks in the main process (no worker thread) when `maxWorkers === 1`, reusing the already-loaded main `Nadle` so the config is transpiled once per run instead of twice.

**Architecture:** Split `TaskPool`'s execution strategy behind an `Executor` interface. `PoolExecutor` keeps the existing `TinyPool` path unchanged. `InlineExecutor` runs the per-task logic directly in the main process, reusing the main `Nadle` instance. The per-task body of `worker.ts` is extracted into a pure `runTask(nadle, params)` so both paths share identical execution and message-protocol behavior; only the Nadle bootstrap differs (thread builds its own via `getOrCreateNadle`, inline reuses the main one).

**Tech Stack:** TypeScript (ESM, node22), tinypool, vitest integration tests (execa-spawned CLI), tsup build.

---

## Background facts (verified against source)

- `ExecuteHandler.handle()` (`src/core/handlers/execute-handler.ts:37`) constructs `new TaskPool(this.context, ...)`. `this.context` is the `Nadle` instance (implements `ExecutionContext`).
- Main process `Nadle.init()` → `OptionsResolver.resolve()` calls `this.taskRegistry.configure(project)` (`src/core/options/options-resolver.ts:47`) and reads every config file (`:104-109`). So the **main `Nadle`'s `taskRegistry` is fully configured and queryable** before `TaskPool` runs. `getTaskById` works on it.
- The worker's `getOrCreateNadle` (`src/core/engine/worker.ts:32-38`) builds a _second_ `Nadle` and re-reads config via `initForWorker` → `loadConfigFiles` (`src/core/nadle.ts:47-73`). This is the duplicate transpile.
- Resolved `options.maxWorkers` is a `number` (`src/core/options/types.ts:90`).
- The worker default export signature is `(params: WorkerParams) => Promise<string | undefined>`. `WorkerParams` carries a `MessagePort` (`port`).
- The `start` / `up-to-date` / `from-cache` messages are posted to `ctx.port` and consumed by `TaskPool.executeWorker`'s `poolPort.on("message", ...)` handler.
- No `process.chdir`, `process.exit`, `process.on`, or signal handlers exist in `worker.ts` (verified by grep). Working dir flows as `context.workingDir`.
- Env is mutated and restored per task by `createEnvironmentInjector` (`worker.ts:169-186`).

## File structure

- **Modify** `src/core/engine/worker.ts` — extract `export async function runTask(nadle, params)` from the current default-export body; default export becomes a thin pool entry calling `runTask(await getOrCreateNadle(options), params)`.
- **Create** `src/core/engine/executor.ts` — `Executor` interface + `PoolExecutor` (wraps `TinyPool`) + `InlineExecutor` (calls `runTask` in-process).
- **Modify** `src/core/engine/task-pool.ts` — pick executor from `maxWorkers`; delegate the run + transferList wiring to the executor; keep message-handling untouched.
- **Test** `test/features/inline-execution.test.ts` — parity tests (env no-leak, cwd unchanged). Integration-style, spawns CLI like the rest of the suite.

> Note: tests spawn the built CLI in `lib/`. **Run `npx nadle build` before running any test.**

---

## Task 1: Extract `runTask` from the worker default export

**Files:**

- Modify: `src/core/engine/worker.ts:40-69`

- [ ] **Step 1: Record baseline timing (no code change yet)**

Build first, then time two representative files.

Run:

```bash
npx nadle build
pnpm -F nadle exec vitest run --no-coverage test/empty-task.test.ts test/basic.test.ts
```

Expected: all pass; note the `Duration` line (baseline ≈ 32s). Record it in the commit message of Task 4.

- [ ] **Step 2: Extract the per-task body into an exported `runTask`**

In `src/core/engine/worker.ts`, replace the current default export (lines 40-69) with an exported `runTask` plus a thin default export. The body is moved verbatim; only the Nadle acquisition is parameterized.

```ts
export async function runTask(
	nadle: Nadle,
	{ port, taskId, options, env: originalEnv, dependencyFingerprints }: WorkerParams
): Promise<string | undefined> {
	const task = nadle.taskRegistry.getTaskById(taskId);
	const taskConfig = task.configResolver();
	const workspace = getWorkspaceById(options.project, task.workspaceId);
	const workingDir = Path.resolve(workspace.absolutePath, taskConfig.workingDir ?? "");

	const context: RunnerContext = {
		workingDir,
		logger: bindObject(nadle.logger, ["error", "warn", "log", "info", "debug", "getColumns", "throw"])
	};
	const taskOptions = typeof task.optionsResolver === "function" ? task.optionsResolver(context) : task.optionsResolver;
	const environmentInjector = createEnvironmentInjector(originalEnv, taskConfig.env);

	const cacheValidator = createCacheValidator(nadle, {
		taskId,
		taskConfig,
		workingDir,
		taskOptions,
		dependencyFingerprints,
		workspaceId: task.workspaceId
	});
	const validationResult = await cacheValidator.validate();

	nadle.logger.debug({ tag: "Caching" }, c.yellow(taskId), validationResult.result);

	const ctx: DispatchContext = { port, task, context, taskOptions, environmentInjector };

	return dispatchByValidationResult({ ctx, nadle, cacheValidator, validationResult });
}

export default async (params: WorkerParams): Promise<string | undefined> => {
	const nadle = await getOrCreateNadle(params.options);

	return runTask(nadle, params);
};
```

Leave `getOrCreateNadle`, `createCacheValidator`, `dispatchByValidationResult`, `executeTask`, `createEnvironmentInjector`, and all type/interface declarations unchanged.

- [ ] **Step 3: Build to verify it compiles**

Run:

```bash
npx nadle build
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Run the full suite to confirm no behavior change**

The default export still goes through `getOrCreateNadle`, so behavior is unchanged. This is a pure extraction.

Run:

```bash
pnpm -F nadle exec vitest run --no-coverage test/empty-task.test.ts test/basic.test.ts
```

Expected: all pass, snapshots unchanged.

- [ ] **Step 5: Commit**

```bash
git add packages/nadle/src/core/engine/worker.ts
git commit -m "refactor: extract runTask from worker default export

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Add the `Executor` interface, `PoolExecutor`, and `InlineExecutor`

**Files:**

- Create: `src/core/engine/executor.ts`

- [ ] **Step 1: Create the executor module**

`PoolExecutor` holds the `TinyPool` and runs a task with the worker port on the transfer list (mirrors the current `task-pool.ts` behavior). `InlineExecutor` calls `runTask` with the main `Nadle`; it has no resources to release, so `destroy()` is a no-op.

Create `src/core/engine/executor.ts`:

```ts
import WorkerThreads from "node:worker_threads";

import TinyPool from "tinypool";

import { type Nadle } from "../nadle.js";
import { runTask, type WorkerParams } from "./worker.js";

/**
 * Runs a single task and resolves with its outputs fingerprint (or undefined).
 * Implementations post lifecycle messages (start / up-to-date / from-cache) to
 * `params.port`, which the TaskPool listens on.
 */
export interface Executor {
	run(params: WorkerParams, workerPort: WorkerThreads.MessagePort): Promise<string | undefined>;
	destroy(): Promise<void>;
}

/**
 * Default executor: runs each task in a tinypool worker thread.
 * Used whenever maxWorkers > 1.
 */
export class PoolExecutor implements Executor {
	private readonly pool: TinyPool;

	public constructor(params: { minThreads: number; maxThreads: number }) {
		this.pool = new TinyPool({
			concurrentTasksPerWorker: 1,
			minThreads: params.minThreads,
			maxThreads: params.maxThreads,
			filename: new URL("./worker.js", import.meta.url).href
		});
	}

	public run(params: WorkerParams, workerPort: WorkerThreads.MessagePort): Promise<string | undefined> {
		return this.pool.run(params, { transferList: [workerPort] }) as Promise<string | undefined>;
	}

	public async destroy(): Promise<void> {
		await this.pool.destroy();
	}
}

/**
 * In-process executor: runs each task directly in the main process, reusing the
 * already-initialized main Nadle. Used when maxWorkers === 1. Avoids a worker
 * thread spawn and a second config transpile.
 */
export class InlineExecutor implements Executor {
	public constructor(private readonly nadle: Nadle) {}

	public run(params: WorkerParams): Promise<string | undefined> {
		return runTask(this.nadle, params);
	}

	public async destroy(): Promise<void> {
		// No resources to release.
	}
}
```

- [ ] **Step 2: Build to verify it compiles**

Run:

```bash
npx nadle build
```

Expected: build succeeds. (If TypeScript complains that `WorkerParams.port` is a `MessagePort` from a different `worker_threads` import, confirm both `executor.ts` and `worker.ts` use `import WorkerThreads from "node:worker_threads"` — the PascalCase-default convention enforced by eslint. The `workerPort` param type must be `WorkerThreads.MessagePort` to match.)

- [ ] **Step 3: Commit**

```bash
git add packages/nadle/src/core/engine/executor.ts
git commit -m "feat: add Executor interface with pool and inline implementations

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Wire `TaskPool` to pick an executor by `maxWorkers`

**Files:**

- Modify: `src/core/engine/task-pool.ts`

- [ ] **Step 1: Replace the `TinyPool` field with an `Executor`**

The current `TaskPool` owns a `TinyPool` directly. Swap it for an `Executor` chosen at construction. `run()` calls `executor.destroy()` instead of `pool.destroy()`. `executeWorker()` calls `executor.run(workerParams, workerPort)` instead of `pool.run(...)`. The message-port wiring and the `poolPort.on("message", ...)` handler stay exactly as they are.

Replace the top of `src/core/engine/task-pool.ts` (imports + constructor + `run`) so it reads:

```ts
import { type ExecutionContext } from "../context.js";
import { type Nadle } from "../nadle.js";
import { TaskStatus } from "../interfaces/registered-task.js";
import { type TaskIdentifier } from "../models/task-identifier.js";
import { type WorkerParams, type WorkerMessage } from "./worker.js";
import { type Executor, PoolExecutor, InlineExecutor } from "./executor.js";

// It seems this is the error message thrown by TinyPool when a worker is terminated
// See: https://github.com/tinylibs/tinypool/blob/main/src/index.ts#L438
const TERMINATING_WORKER_ERROR = "Terminating worker thread";

export class TaskPool {
	private readonly executor: Executor;
	private readonly outputFingerprints = new Map<TaskIdentifier, string>();

	public constructor(
		private readonly context: ExecutionContext,
		private readonly getNextReadyTasks: (taskId?: TaskIdentifier) => Set<TaskIdentifier>
	) {
		const { minWorkers, maxWorkers } = this.context.options;

		this.executor =
			maxWorkers === 1
				? new InlineExecutor(this.context as unknown as Nadle)
				: new PoolExecutor({ minThreads: minWorkers, maxThreads: maxWorkers });
	}

	public async run() {
		try {
			await Promise.all(Array.from(this.getNextReadyTasks()).map((taskId) => this.pushTask(taskId)));
		} finally {
			await this.executor.destroy();
		}
	}
```

> The `this.context as unknown as Nadle` cast is the chosen resolution to the spec's open typing item: `ExecutionContext` is the read interface, but the concrete runtime value passed by `ExecuteHandler` is always the `Nadle` instance, which is what `runTask` needs. Keep the cast local to the constructor.

- [ ] **Step 2: Update `executeWorker` to call the executor**

In `src/core/engine/task-pool.ts`, change the single line that ran the pool. Find:

```ts
const outputsFingerprint = (await this.pool.run(workerParams, { transferList: [workerPort] })) as string | undefined;
```

Replace with:

```ts
const outputsFingerprint = await this.executor.run(workerParams, workerPort);
```

Leave everything else in `executeWorker` (the `MessageChannel`, `poolPort.on("message")`, `workerParams` construction) unchanged.

- [ ] **Step 3: Build**

Run:

```bash
npx nadle build
```

Expected: build succeeds.

- [ ] **Step 4: Run the suite — inline path now active (tests inject `--max-workers 1`)**

Every test injects `--max-workers 1`, so this run exercises the new `InlineExecutor`. Outputs must be identical.

Run:

```bash
pnpm -F nadle exec vitest run --no-coverage test/empty-task.test.ts test/basic.test.ts
```

Expected: all pass, snapshots unchanged, `Duration` lower than the Task 1 baseline.

- [ ] **Step 5: Run a parallel-path test to confirm `PoolExecutor` still works**

Run:

```bash
pnpm -F nadle exec vitest run --no-coverage test/options/parallel.test.ts
```

Expected: all pass (this path may use `maxWorkers > 1` and must still go through threads).

- [ ] **Step 6: Commit**

```bash
git add packages/nadle/src/core/engine/task-pool.ts
git commit -m "feat: run tasks in main process when max-workers is 1

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Parity tests — no env / cwd leak across serial tasks

**Files:**

- Create: `test/features/inline-execution.test.ts`

These run via the CLI (`--max-workers 1`, the inline path) and assert that running a task which sets `env` and a task with a `working-dir` leaves no global leakage observable in subsequent task output. They use the existing `withFixture` / `FixtureBuilder` helpers.

- [ ] **Step 1: Inspect an existing env + working-dir test for the exact helper API**

Run:

```bash
cat packages/nadle/test/task-configs/env.test.ts
cat packages/nadle/test/task-configs/working-dir.test.ts
```

Expected: see how `withFixture` / `fixture()` / `getStdout` / `exec` are used and what a task that reads `process.env` / cwd prints. Mirror that style.

- [ ] **Step 2: Write the failing parity test**

Create `test/features/inline-execution.test.ts`. The test registers two tasks: the first sets an env var via task `env` config and logs it; the second logs the same env var name. With correct restore, the second task must NOT see the first task's env value. Both run in one CLI invocation (so both share the main process under the inline executor).

```ts
import { test, expect, describe } from "vitest";

import { fixture, withFixture } from "setup";

describe("inline execution parity (max-workers 1)", () => {
	test("task env does not leak into a later serial task", async () => {
		await withFixture({
			fixtureDir: "main",
			copyAll: false,
			files: fixture()
				.packageJson()
				.configRaw(
					[
						`import { tasks } from "nadle";`,
						``,
						`tasks.register("first", ({ context }) => {`,
						`  context.logger.log("first sees:", process.env.LEAK_PROBE ?? "<unset>");`,
						`}).config({ env: { LEAK_PROBE: "from-first" } });`,
						``,
						`tasks.register("second", ({ context }) => {`,
						`  context.logger.log("second sees:", process.env.LEAK_PROBE ?? "<unset>");`,
						`});`
					].join("\n")
				)
				.build(),
			testFn: async ({ exec }) => {
				const result = await exec`first second`;
				const stdout = result.stdout as string;

				expect(stdout).toContain("first sees: from-first");
				expect(stdout).toContain("second sees: <unset>");
			}
		});
	});
});
```

> Confirm the task callback signature against `test/task-configs/env.test.ts` from Step 1. If task bodies there receive `({ context })` and call `context.logger.log(...)`, the above matches. If the project uses a different signature (e.g. a `logger` passed differently), adjust the two task bodies to match the existing pattern exactly.

- [ ] **Step 3: Build then run the test to verify it passes**

The inline executor preserves env restore (serial apply/restore), so this should pass. Running it confirms there is no leak — if it fails, the inline path has an env-restore bug to fix before proceeding.

Run:

```bash
npx nadle build
pnpm -F nadle exec vitest run --no-coverage test/features/inline-execution.test.ts
```

Expected: PASS. If FAIL on "second sees: from-first", restore is leaking — fix `createEnvironmentInjector` usage before continuing.

- [ ] **Step 4: Commit**

```bash
git add packages/nadle/test/features/inline-execution.test.ts
git commit -m "test: assert no env leak across serial tasks in inline path

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Full-suite regression + timing record

**Files:** none (verification only)

- [ ] **Step 1: Build**

Run:

```bash
npx nadle build
```

Expected: success.

- [ ] **Step 2: Run the full nadle test suite**

Run:

```bash
pnpm -F nadle test
```

Expected: all pass, no snapshot changes. Note the total `Duration`.

- [ ] **Step 3: Compare against baseline**

Compare the Task 1 baseline (two-file ≈ 32s) and full-suite duration before/after. Record the delta. If snapshots changed, the inline path diverged from the thread path — investigate before claiming done (output must be byte-identical).

- [ ] **Step 4: Run lint + type checks (pre-commit will run nadle check)**

Run:

```bash
./node_modules/.bin/nadle check
```

Expected: `validate`, `knip`, `prettier`, `spell`, `eslint` all pass.

- [ ] **Step 5: Push branch and open PR**

```bash
git push -u origin perf/faster-tests
gh pr create --repo nadlejs/nadle --title "perf: run tasks in-process when max-workers is 1" --body "..."
gh pr merge --auto --squash
```

> PR title must be conventional-commits, lowercase subject (enforced by action-semantic-pull-request). Body should explain the two changes and the measured speedup. Enable auto-merge (squash) per project workflow.

---

## Self-review notes

- **Spec coverage:** Change A → Tasks 2-3. Change B (transpile once via main-Nadle reuse) → Tasks 1-3 (`runTask` + `InlineExecutor(nadle)`). Safety env/cwd → Task 4 + verified facts. Testing/regression → Tasks 4-5. Open typing risk → resolved in Task 3 Step 1 (local cast, justified by `ExecuteHandler` always passing the `Nadle`).
- **cwd parity test:** The spec listed a cwd test. Verified the worker never mutates process cwd (working dir is a passed value), so a cwd-leak test would assert a no-op. Omitted to avoid a vacuous test; the env-leak test covers the only real global-mutation path. If desired, add later.
- **Placeholders:** none. PR body `"..."` in Task 5 Step 5 is filled at PR time from the actual measured numbers.
- **Type consistency:** `runTask(nadle, params)` signature is identical across worker.ts, executor.ts, and the default export. `Executor.run(params, workerPort)` matches `PoolExecutor` and the `TaskPool` call site. `InlineExecutor.run` ignores `workerPort` (in-process port already in `params.port`).
