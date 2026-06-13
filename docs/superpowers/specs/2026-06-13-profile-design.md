# Profiling Insights (extends `--summary`) Design

**Status:** Approved. User chose to **fold the new sections into `--summary`** rather
than add a separate `--profile` flag (the analysis is the same profiling concern; one
flag keeps the surface small).
**Issue:** [#648](https://github.com/nadlejs/nadle/issues/648) — flamegraph + cache-miss hotspots, extends `--summary`.

## Scope

`--summary` already prints a top-N task wall-clock table (`profiling-summary.tsx`).
This change extends `--summary` itself with two analysis sections (no new flag):

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
equivalent). A machine-readable JSON export for external flamegraph tools is a
sensible follow-up, not built now.

`--summary` now renders the existing duration table plus the two new sections. There
is no separate `--profile` flag.

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

- No new CLI option — the sections render under the existing `--summary` gate.
- **`core/reporting/profile-report.ts`** — new module (mostly pure):
  - `computeCriticalPath({ roots, getDependencies, getDuration }): { path: string[];
duration: number }` — longest cumulative-duration chain. Pure.
  - `renderProfileReport({ criticalPath, hotspots }): string` — formats the two
    sections (reuses the table style from `profiling-summary.tsx` where useful). Pure.
  - A `Hotspot` shape `{ label, duration, suggestion }`.
  - `collectProfileData(accessors)` / `profileAccessors(context, tracker)` — build the
    report data from the live scheduler + tracker, shared by both reporters so neither
    duplicates the traversal.
- **`core/reporting/reporter.ts`** — in `onExecutionFinish`, under the existing
  `options.summary` gate, render the duration table then append the profile report.
- **`core/reporting/agent-reporter.ts`** — under `options.summary`, emit plain
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

No new flag → no help/show-config/config-key churn. The existing `--summary` output
gains the two sections; the existing summary test (`features/profiling-summary.test.ts`)
does not assert the full block verbatim, so it is unaffected.

## Out of scope (YAGNI)

- Graphical SVG/HTML flamegraph.
- JSON machine export (sensible follow-up for external flamegraph tools).
- Per-task CPU/memory profiling (wall-clock only; that's what the scheduler tracks).
