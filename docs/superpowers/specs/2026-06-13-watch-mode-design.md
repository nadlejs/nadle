# Watch Mode (`--watch`) — Design

**Issue:** #265 · **Milestone:** v0.8 — Developer Experience · **Date:** 2026-06-13

## Goal

`nadle <tasks...> --watch` runs the requested tasks once, then stays alive and
re-runs them whenever any of their declared `inputs` change — until the user
presses Ctrl-C. The headline DX feature for v0.8.

## Why this fits nadle

Every cacheable task already declares `inputs` (file/dir globs) for its cache
key. That same declaration **is** the watch list — no new user configuration.
Re-running through the normal scheduler + cache means a change to one input only
re-executes the tasks actually affected; everything else reports `up-to-date`
and is skipped. Watch mode is therefore mostly *wiring existing machinery to a
file watcher*, not new build logic.

## Non-Goals (YAGNI)

- **Cancel-and-restart** mid-run on change — deferred to a future `--watch`
  sub-option. Default is finish-then-rerun.
- **Clear-screen between runs** — not now.
- **Configurable poll interval / watch globs** — the cache `inputs` are the
  watch set; no override.
- **Daemon mode** — explicit roadmap non-goal.

## Architecture

Four focused units.

### 1. `--watch` flag

Boolean CLI flag (alias `-w`), default `false`. Wired through `cli-options.ts`,
`types.ts` (`NadleCLIOptions`), and the resolver default — identical pattern to
`--why` / `--graph`. Grouped under "Execution options" in `--help`.

### 2. `WatchHandler` (`core/handlers/watch-handler.ts`)

`canHandle()` returns `this.context.options.watch`. Registered before
`ExecuteHandler` (like dry-run/graph). Responsibilities:

- Resolve the requested tasks (`options.tasks`) and, via the scheduler, their
  full transitive dependency set.
- Collect every task's `inputs` declarations, resolve them to concrete paths
  (`Declaration.resolve`), and dedupe into a flat watch set. Config files
  (root + workspace) are also watched, since they invalidate everything.
- If the watch set is empty (no requested/dependency task declares inputs),
  log a warning ("No watchable inputs for the requested tasks") and exit 0 —
  there is nothing to watch.
- Run the tasks once (initial build) through the same execute path as
  `ExecuteHandler`.
- Start the `TaskWatcher`; on each debounced change, run again.
- On `SIGINT`, close the watcher and exit 0.

The handler does **not** re-resolve the dependency graph per cycle in v1 — the
task set and watch paths are computed once at startup. (A config-file change is
watched and triggers a rerun, but does not currently re-discover newly-added
tasks; documented as a known limitation, revisit if needed.)

### 3. `TaskWatcher` (`core/watch/task-watcher.ts`)

Thin wrapper over **chokidar**. Construction takes the resolved watch paths and
a `cwd`. Responsibilities:

- Watch the paths with `ignoreInitial: true` and `awaitWriteFinish` (stabilizes
  editor atomic-saves; also makes tests deterministic).
- Debounce raw change events (~100 ms) into a single "changed" signal.
- **Serialize + coalesce:** expose `onChange(run: () => Promise<void>)`. While a
  `run` is in flight, set a `pending` flag instead of starting a second run; when
  the run resolves, if `pending` was set, clear it and run exactly once more.
  This collapses a burst of edits during a long build into a single follow-up
  run (not a queue of N).
- `close()` for teardown.

chokidar is a **runtime dependency of the `nadle` package** but only loaded on
the watch path (dynamic `import` inside the handler) so it never enters the
default CLI startup or the bundled size-limit surface for non-watch runs.

### 4. Re-run path

Each cycle calls the existing scheduler + `TaskPool` flow that `ExecuteHandler`
uses, with the same resolved task list. The cache does the pruning. Between
cycles the handler logs a separator and a `Watching for changes… (Ctrl-C to
exit)` line after the run settles.

## Data Flow

```
nadle build --watch
  │
  ▼
WatchHandler.handle()
  ├─ resolve tasks + deps → collect inputs → resolve to paths → watch set
  ├─ run once (scheduler + TaskPool, cache active)
  ├─ TaskWatcher.start(watchSet)
  │     └─ chokidar change → debounce → onChange callback
  │           └─ serialize/coalesce → run again (cache prunes unaffected tasks)
  └─ SIGINT → watcher.close() → exit 0
```

## Error Handling

- A failed run cycle prints the error (same formatting as a normal failed run)
  and **keeps watching** — watch mode never exits on task failure, only on
  Ctrl-C. This is the core watch-mode contract: fix the error, save, it re-runs.
- chokidar `error` events are logged; the watcher stays up.
- SIGINT during a run: stop accepting new cycles, let the current run settle (or
  the process exits on second Ctrl-C), close the watcher, exit 0.

## Reporter Interaction

The live Ink footer must not persist across cycles. Watch runs log normally per
cycle; the footer (if enabled) renders within a cycle and tears down at settle,
then the "Watching…" line prints. In non-TTY contexts the footer is already off.

## Testing

Integration-first, via the test harness. New helper needed: spawn `--watch` as a
long-lived process, wait for a stdout marker (run complete / "Watching…"),
mutate a fixture input via the existing `createFileModifier`, wait for the next
run, assert, then send SIGINT and assert exit 0.

Test cases:

1. **Initial run** — `--watch` runs the task once and prints the "Watching…"
   line.
2. **Re-run on input change** — modifying a watched input triggers a second run
   of the affected task.
3. **Cache pruning** — when two tasks are requested and only one's input
   changes, the unaffected task reports `up-to-date` on the re-run.
4. **No watchable inputs** — requesting a task with no `inputs` warns and exits.
5. **Ctrl-C** — SIGINT exits 0 and stops the process.

`awaitWriteFinish` keeps timing deterministic. Watch tests likely start
`skipIf(isWindows)` (chokidar mitigates but Windows watch is the #420 risk
area); tracked with #420.

## Reused As-Is

- `Declaration.resolve` — input globs → concrete paths.
- Scheduler's transitive-dependency walk — to gather the full input set.
- `TaskPool` + cache — the per-cycle execution and pruning.
- `createFileModifier` test helper — fixture mutation in tests.

## Risks

- **Windows watch reliability** — the persistent cross-platform weak spot.
  chokidar is the standard mitigation; if Windows watch tests flake they start
  skipped and fold into the #420 effort.
- **Config-file change → new tasks** — v1 watches config files and reruns, but
  does not re-discover tasks added to the config mid-session. Documented
  limitation; revisit on demand.
