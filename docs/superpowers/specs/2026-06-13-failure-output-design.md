# Better Failure Output Design

**Status:** Approved (self-driven; user directed "do features, don't ask").
**Issue:** [#639](https://github.com/nadlejs/nadle/issues/639) — surface logs, repro command, and skip count on failure.

## Scope

Issue #639 asks for three things on a task failure:

1. **Repro command** — the exact command to re-run just the failing task.
2. **Surface the failing task's logs** — not buried in worker output.
3. **"N downstream tasks skipped"** — a one-line count.

This slice ships **(1) and (3)**, which are cheap, universal, and low-risk. **(2) is
deferred** to a follow-up: per-task log buffering across the worker-thread boundary is
an architectural change (the logger currently streams straight through; there is no
per-task buffer). Shipping 1+3 now is a clean, high-value increment; a tracking issue
will capture log surfacing. The deferral is logged via `log()`-equivalent (a note in
the follow-up issue), not silently dropped.

## (1) Repro command

In `DefaultReporter.onTaskFailed(task)` — right after the existing `FAILED` line —
print a dim hint:

```
✗ Task build FAILED 1.2s
  ↪ to re-run just this task: nadle build
```

The runnable token is `task.label` (the same form `--graph`/`--explain` print and that
users type on the command line). When the failing task is one the user requested
directly and passthrough args were given, include them:

```
  ↪ to re-run just this task: nadle build -- --coverage
```

Passthrough args come from `this.context.options.passthroughArgs`. Only append them
when the failed task id is among the requested tasks (`options.tasks`), since
passthrough only reaches requested tasks (per spec 09-cli). Otherwise omit.

`AgentReporter.onTaskFailed` gets the same hint in its plain one-line style:
`REPRO nadle build`.

## (3) Downstream-skipped count

When a task fails, `TaskPool.pushTask` rethrows and the recursive
`getNextReadyTasks` scheduling never runs, so every task that was scheduled but never
reached a terminal state is left in `TaskStatus.Scheduled`. That set **is** the
downstream-skipped set — no graph traversal or new scheduler accessor needed.

`ExecutionTracker` already records this: `getTaskStateByStatus(TaskStatus.Scheduled)`
returns exactly those tasks at `onExecutionFailed` time. Add a tracker getter:

```ts
public get skippedCount(): number {
  return this.getTaskStateByStatus(TaskStatus.Scheduled).length;
}
```

In `DefaultReporter.onExecutionFailed`, extend the summary tail when `skippedCount > 0`:

```
RUN FAILED in 1.2s (1 task executed, 1 task failed, 2 downstream tasks skipped)
```

`AgentReporter.summaryLine` gets `skipped N` appended to its counts when `> 0`.

### Why "still Scheduled" is correct

- A successful task → `Finished`/`UpToDate`/`FromCache`.
- The failing task → `Failed`.
- A force-canceled worker → `Canceled`.
- Tasks that would have run downstream of the failure are never pushed, so they keep
  their `onTasksScheduled` status of `Scheduled`. Nothing else leaves a task in
  `Scheduled` at the end of a run. (Tasks excluded or never scheduled never entered
  `taskStates`.)

## Architecture / files

- **`core/models/execution-tracker.ts`** — add `skippedCount` getter (pure derivation
  from existing `taskStates`).
- **`core/reporting/reporter.ts`** — repro hint in `onTaskFailed`; skipped tail in
  `onExecutionFailed`.
- **`core/reporting/agent-reporter.ts`** — `REPRO` line in `onTaskFailed`; `skipped N`
  in `summaryLine`.

No new public API, no scheduler change, no worker change. Resolved-options object is
untouched, so **no option-dump snapshot churn**.

## Testing

Integration-first. A fixture with a failing task that has a downstream dependent:

```ts
tasks.register("flaky", () => {
	throw new Error("boom");
});
tasks.register("after").config({ dependsOn: ["flaky"] });
```

- **`test/options/failure-output.test.ts`** (default reporter):
  - failing run prints `to re-run just this task: nadle flaky`.
  - failing run with a downstream task prints `1 downstream task skipped` (singular)
    / `N downstream tasks skipped` (plural) — assert the count and pluralization.
  - passthrough args (`nadle flaky -- x`) appear in the repro hint when `flaky` is the
    requested task.
- **agent reporter** variant (`--reporter agent`): `REPRO nadle flaky` and `skipped 1`
  in the summary line.
- **`test/unit/execution-tracker.test.ts`** (if one exists, else add): `skippedCount`
  reflects tasks left in `Scheduled`.

## Snapshot impact

`onExecutionFailed` output appears in `errors.test.ts.snap` and any failure snapshots.
Those WILL change (new skipped tail + repro line). Regenerate the affected failure
snapshots with `-u`, run each alone to prune obsolete keys, verify `CI=true`. No
resolved-options dump is touched, so builtin-task/help/show-config/config-key snapshots
are unaffected.

## Out of scope (YAGNI)

- Per-task log capture/surfacing (deferred — follow-up issue).
- Reconstructing the underlying shell command for exec tasks (needs RunnerContext at
  reporter time; `nadle <label>` is a sufficient universal reproducer).
- Marking downstream tasks `Canceled` instead of leaving them `Scheduled` (the derived
  count is enough; changing statuses would ripple through every reporter).
