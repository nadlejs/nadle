# `nadle --profile` (Profiling Insights) Design

**Status:** Approved (self-driven; user directed "do features, don't ask").
**Issue:** [#648](https://github.com/nadlejs/nadle/issues/648) — `--profile` flamegraph + cache-miss hotspots, extends `--summary`.

## Scope

`--summary` already prints a top-N task wall-clock table (`profiling-summary.tsx`).
`--profile` extends that report with two analysis sections:

1. **Critical path** — the longest cumulative-duration dependency chain (root → … →
   leaf). This is the terminal-appropriate equivalent of a flamegraph's hot stack: the
   sequence of tasks that actually bounded the run. Printed as `a → b → c (1.8s)`.
2. **Cache-miss hotspots** — the tasks that executed (rather than being served from
   cache or skipped as up-to-date), ranked by duration, each with an actionable
   suggestion:
   - task declares no `inputs`/`outputs` → "not cacheable; declare inputs & outputs to
     enable caching".
   - task declares them but still ran → "cache missed; an input changed".

A graphical SVG/HTML flamegraph is **out of scope** (a terminal task runner shouldn't
spawn a browser asset; the duration table + critical path is the in-terminal
equivalent). A machine-readable `--profile=json` export for external flamegraph tools
is a sensible follow-up, noted below, not built now.

`--profile` implies `--summary`'s table (it's the same data); setting `--profile`
renders the table plus the two new sections. `--summary` alone stays unchanged.

## Data available

At `onExecutionFinish`, `ExecutionTracker` holds per-task `status`, `duration`, and
`startTime`. The scheduler (still initialized on the context) exposes
`getDirectDependencies` and `getTransitiveDependencies`. That's everything needed:

- Critical path: over the executed tasks, find the chain maximizing summed duration by
  walking `getDirectDependencies` from each requested root, memoizing the
  longest-duration path to each task.
- Cache-miss hotspots: tasks with `status === Finished` (executed) vs `UpToDate` /
  `FromCache`. Whether a task declares inputs/outputs comes from
  `task.configResolver()`.

## Architecture / files

- **`core/options/cli-options.ts`** — add `profile` boolean option (default false,
  grouped under "General options:" next to `summary`).
- **`core/options/types.ts`** — `NadleCLIOptions.profile?: boolean`; it is a plain
  boolean with a default, so it stays inside the `Required<>` of
  `NadleResolvedOptions` (like `summary`). Add `profile: false` to `defaultOptions`.
- **`core/reporting/profile-report.ts`** — new pure module:
  - `computeCriticalPath({ roots, getDependencies, getDuration }): { path: string[];
    duration: number }` — longest cumulative-duration chain. Pure.
  - `renderProfileReport({ criticalPath, hotspots }): string` — formats the two
    sections (reuses the table style from `profiling-summary.tsx` where useful). Pure.
  - A `Hotspot` shape `{ label, duration, suggestion }`.
- **`core/reporting/reporter.ts`** — in `onExecutionFinish`, when `options.profile`,
  render the existing summary table (as today) then append the profile report built
  from tracker + scheduler data.
- **`core/reporting/agent-reporter.ts`** — when `options.profile`, emit plain
  `CRITICAL <a> <b> <c> <dur>` and `HOTSPOT <label> <dur> <suggestion>` lines (stable,
  greppable), consistent with its one-line style.

The critical-path computation is pure and injectable (deps + durations passed in), so
it is unit-testable without a real run, like `computeAffectedTasks`.

## Critical path algorithm

```
bestFrom(taskId):                # memoized
  deps = getDependencies(taskId)
  if deps empty: return { path: [taskId], duration: getDuration(taskId) }
  best = max over deps of bestFrom(dep)
  return { path: [...best.path, taskId], duration: best.duration + getDuration(taskId) }
criticalPath = max over roots of bestFrom(root)   # path printed root→leaf (reverse)
```

Durations of non-executed tasks (cached/up-to-date) count as ~0, so the path reflects
real wall-clock spent.

## Testing

- **`test/unit/profile-report.test.ts`** — `computeCriticalPath` over hand-built
  graphs: linear chain, diamond (picks the heavier branch), single task; and
  `renderProfileReport` for the hotspot suggestions (no-inputs vs cache-missed) and the
  empty case.
- **`test/options/profile.test.ts`** — integration with a caching fixture: run a task
  graph where one task has declared inputs (cacheable) and one doesn't; assert the
  report shows a critical path and flags the non-cacheable task with the
  declare-inputs suggestion. Run twice to assert a cache hit drops a task out of the
  hotspots on the second run.

## Snapshot impact

`--profile` adds a new flag → `--help` snapshot regenerates (one file). The
resolved-options dump gains `profile`, but #658's redaction shields builtin-task
snapshots; show-config/config-key only serialize set options (profile defaults false →
absent unless asserted). Regenerate help; verify show-config/config-key with `-u` if
they assert the dump with profile set. No failure-path snapshots touched.

## Out of scope (YAGNI)

- Graphical SVG/HTML flamegraph.
- `--profile=json` machine export (sensible follow-up for external flamegraph tools;
  file an issue if wanted).
- Per-task CPU/memory profiling (wall-clock only; that's what the scheduler tracks).
