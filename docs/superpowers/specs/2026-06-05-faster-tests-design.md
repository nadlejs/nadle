# Faster nadle tests — design

Date: 2026-06-05
Branch: `perf/faster-tests`

## Problem

The nadle test suite is slow. Tests spawn the real CLI via `execa` (~200 spawns
across 58 files), and each spawn pays a fixed cold-start cost. Measured: a single
bare CLI boot (`--help`) is ~0.5s; an in-test `exec` runs 0.7–1.3s. Two
representative files (`empty-task.test.ts` + `basic.test.ts`, 23 tests) take ~32s.
CI runs with `retry: 5`, multiplying failure cost.

### Measured cost breakdown (per CLI spawn)

| Cost                    | Approx    | Notes                                              |
| ----------------------- | --------- | -------------------------------------------------- |
| Node boot + module load | ~0.5s     | Floor while tests spawn the real CLI.              |
| Config jiti transpile   | ~50ms × 2 | Transpiled twice: main `OptionsResolver` + worker. |
| tinypool thread spawn   | ~28ms     | Plus re-import of `worker.js` module graph.        |
| Nadle worker re-init    | varies    | `getOrCreateNadle` rebuilds Nadle in the thread.   |
| fs (cp / mkdir / rm)    | small-mid | Per-test fixture setup/teardown.                   |

Two facts drive the design:

1. **Config is transpiled twice per run.** `OptionsResolver.resolve()`
   (`options-resolver.ts:102-108`) reads+transpiles the config for task
   selection; the worker's `loadConfigFiles()` (`nadle.ts:58-73`) reads+transpiles
   it again in the worker thread with a fresh `Nadle` + fresh `DefaultFileReader`.
2. **A worker thread is spawned even when `--max-workers 1`.** Every test injects
   `--max-workers 1` (`exec.ts:37-39`), yet `TaskPool` always constructs a
   `TinyPool` (`task-pool.ts:20-26`), paying thread spawn, worker module re-import,
   and a second Nadle init.

## Goals

- Cut suite wall-clock time. Both changes target prod hot paths, not test-only
  shims, so real serial users benefit too.
- Snapshots stay byte-identical. Output must not differ between inline and thread
  execution.
- No env / cwd leakage across serial tasks in the in-process path.

## Non-goals

- Reducing the number of CLI spawns (batching, in-process Nadle calls bypassing
  execa). Out of scope for this round.
- Touching the parallel (`maxWorkers > 1`) execution path beyond the interface
  extraction.
- jiti `fsCache` tuning for cross-spawn reuse. The "transpile once" change removes
  the duplicate within a run; cross-spawn caching is a separate, later lever.

## Approach

### Change A — In-process execution when `maxWorkers === 1`

`TaskPool` gets a strategy split selected at construction:

- `maxWorkers === 1` → **InlineExecutor**: run the per-task worker logic directly
  in the main process. No thread, no `worker.js` re-import.
- `maxWorkers > 1` → **PoolExecutor**: existing `TinyPool` path, unchanged.

Extract an `Executor` interface:

```ts
interface Executor {
	run(params: WorkerParams, port: MessagePort): Promise<string | undefined>;
	destroy(): Promise<void>;
}
```

- `PoolExecutor` wraps `TinyPool` (current `executeWorker` body, transferList wiring).
- `InlineExecutor` calls the per-task function directly, passing the same
  `MessageChannel` port pair `TaskPool` already creates. The `start` /
  `up-to-date` / `from-cache` message protocol is unchanged — `TaskPool`'s
  `poolPort.on("message", ...)` handler stays as-is.

`TaskPool` picks the executor in its constructor from
`context.options.maxWorkers`. `run()` / `pushTask()` / `executeWorker()` message
handling is otherwise untouched.

### Change B — Transpile config once, share with the inline path

Refactor `worker.ts` to separate per-task logic from Nadle bootstrap:

- Keep the existing default export (`async (params) => ...`) as the **pool entry**.
  It still calls `getOrCreateNadle(options)` because a fresh thread has no Nadle.
- Extract a pure `runTask(nadle: Nadle, params: WorkerParams): Promise<string | undefined>`
  containing the current body from `nadle.taskRegistry.getTaskById` through
  `dispatchByValidationResult`. The default export becomes
  `runTask(await getOrCreateNadle(options), params)`.

`InlineExecutor` calls `runTask(mainNadle, params)` directly, where `mainNadle`
is the already-initialized instance the CLI built via `Nadle.init()`
(`OptionsResolver` already populated `taskRegistry` + `fileOptionRegistry`). The
second config transpile is eliminated for serial runs — not merely cached.

`TaskPool` needs access to the main `Nadle`. It already holds `ExecutionContext`
(`this.context`), which the `Nadle` instance implements. `InlineExecutor`
receives that instance.

Pool runs are unchanged: each thread still builds its own Nadle via
`getOrCreateNadle` and transpiles config once per thread.

## Safety — env / cwd parity + restore

Thread isolation is free; in-process is not. Guarantees:

1. **`process.env`** — `createEnvironmentInjector` (`worker.ts:169-186`) applies
   task env before run and restores after. With `maxWorkers === 1` tasks run
   **serially**, so apply/restore never interleaves. Restore deletes added keys and
   recovers originals. The inline path keeps this wrapper unchanged → env is clean
   across tasks.
2. **cwd** — the worker never changes the process working directory; working dir
   flows as `context.workingDir` (`worker.ts:44-47`). No global cwd mutation,
   nothing to restore. (Verified by grep: no working-directory change in worker or
   nadle core.)
3. **AsyncLocalStorage** — inline execution runs under the main process's active
   `runWithInstance(mainNadle)` scope (`nadle-context.ts`). One instance, no
   collision. The thread path keeps its own `workerNadle`.
4. **Process-global side effects** — verified absent: no `process.on`,
   `process.exit`, or signal handlers in `worker.ts`.

## Testing

New parity tests:

- A task that sets `env` runs, then a second serial task in the same run observes
  a clean `process.env` (no leaked keys).
- A `working-dir` task runs; `process.cwd()` in the main process is unchanged
  after the run.

Regression bar:

- Full `pnpm -F nadle test` passes.
- Snapshots byte-identical (inline output must equal thread output).

Verification protocol:

- Baseline-time `empty-task.test.ts + basic.test.ts` before changes (~32s now).
- Re-time after Change A, then after Change B. Record deltas.
- Build (`npx nadle build`) before running tests — integration tests run the built
  CLI in `lib/`, not source.

## Risks

- **Inline path drift from thread path.** Mitigated by routing both through the
  shared `runTask`, so only bootstrap differs.
- **Env restore gaps under future parallel-inline.** Out of scope: inline is only
  selected when `maxWorkers === 1` (strictly serial). `maxWorkers > 1` keeps
  threads.
- **`ExecutionContext` vs `Nadle` typing.** `runTask` needs the concrete `Nadle`
  (uses `taskRegistry`, `logger`, `options.project`). Confirm `TaskPool.context`
  exposes what `runTask` needs, or pass the `Nadle` explicitly into `InlineExecutor`.
