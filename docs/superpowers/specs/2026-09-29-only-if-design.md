# `onlyIf` — Conditional Task Execution

**Date**: 2026-09-29
**Status**: Approved, pending implementation

## Intent

Let a task declare a runtime predicate that decides whether its body executes. Modeled on
Gradle's `onlyIf`, which users coming from Gradle already expect to find.

The motivating shape is a task that should not run under conditions only known once its
dependencies have finished — "skip the publish step when nothing changed", "only run this
on CI", "skip when the generated file the previous task wrote is empty".

### Non-goals

- **No `enabled` field.** Gradle has both; `onlyIf: () => false` covers the static case,
  and a second spelling of the same concept is not worth the API surface.
- **No CLI counterpart.** `--exclude` already covers "don't run this task from the command
  line", with different (pruning) semantics.
- **No subtree pruning.** Skipping is per-task, not "skip this and everything only it needed".

## Semantics

```ts
onlyIf?: (context: RunnerContext) => boolean | Promise<boolean>;
```

Omitted, or resolves `true` → the task executes normally. Resolves `false` → the task is
**skipped**.

### Gradle parity

A skipped task affects only itself:

- Its dependencies have **already run** — the predicate is evaluated after they complete.
- Its dependents **still run**, and treat the skipped task as satisfied.

This matches Gradle: `onlyIf` is a late veto on one task's action, not a graph edit.

### Evaluation point

The predicate is evaluated **in the worker, at execution time**, after the task's
configuration, options, and working directory are resolved, and **before cache validation**.

Consequences, all deliberate:

- The predicate may inspect state produced by dependencies. This is the main reason to
  evaluate late, and the main reason `onlyIf` is more useful than a static boolean.
- A skipped task performs **no cache work at all**: no fingerprint is computed, no outputs
  are restored, no cache entry is written. Fingerprinting a task you were told not to run is
  wasted I/O, and writing an entry for a body that never executed would poison the cache.
- `--dry-run` does **not** evaluate predicates, so skipping is invisible in the execution
  plan. Dry run reports the intended plan, not a prediction of runtime decisions.

### Predicate failure

A predicate that throws (or rejects) fails the task with status `Failed`, exactly as a
throwing task body would. `timeout` and `retries` do **not** apply to the predicate — those
are specified as bounding the task function only.

### Predicate argument

The predicate receives the existing `RunnerContext` — the same object passed to the task
body, carrying `logger`, `workingDir`, and `passthroughArgs`. No new public type is
introduced.

One open detail to settle during implementation: a task body is invoked as
`run({ options, context })`, not `run(context)`. The predicate should follow whichever shape
reads better next to it — either `onlyIf(context)` for brevity, or `onlyIf({ options,
context })` for symmetry with `run`. The latter also gives the predicate access to resolved
task options, which `RunnerContext` alone does not carry. Symmetry with `run` is the
better default unless it proves awkward in practice.

## Status Lifecycle

A new terminal status `Skipped = "skipped"`, entered directly from `Scheduled` alongside
`UpToDate` and `FromCache`:

```
                                    +-> Finished
                                    |
Registered -> Scheduled -> Running -+-> Failed
                  |                 |
                  |                 +-> Canceled
                  +-> UpToDate
                  +-> FromCache
                  +-> Skipped
```

- A skipped task never enters `Running` and never emits a start event.
- The Running counter is not incremented or decremented for it.
- It counts toward "done" for progress reporting.

## Worker Protocol

A fourth message type joins `"start"`, `"up-to-date"`, `"from-cache"`:

| Type        | Fields     | Meaning                                                     |
| ----------- | ---------- | ----------------------------------------------------------- |
| `"skipped"` | `threadId` | The `onlyIf` predicate resolved false. No execution needed. |

The worker execution flow gains a step between working-directory resolution and cache
validation: resolve `onlyIf`; if it resolves false, send `"skipped"` and return.

## Events and Plugins

New listener event:

| Event           | Parameters | When Emitted                                  |
| --------------- | ---------- | --------------------------------------------- |
| `onTaskSkipped` | `task`     | When the task's `onlyIf` predicate is falsey. |

Plugin hook mapping:

- `beforeTask` does **not** fire for a skipped task. It already fires only for tasks that
  actually execute; a skipped task does not.
- `afterTask` **does** fire, via `onTaskSkipped`. It already fires for cache hits, and the
  spec documents "afterTask always fires" as a property plugins rely on. Skipped is another
  settled-without-running outcome and belongs in the same set.

This preserves the existing (documented) asymmetry rather than introducing a second, different one.

## Reporting

- Per-task: a `SKIPPED` line, in the same position `UP-TO-DATE` / `FROM-CACHE` occupy.
- Summary: `N skipped`, alongside `N up-to-date` and `N restored from cache`.
- Both the default reporter and the agent reporter.

## Configuration Schema

`TaskConfigurationSchema` is a hand-maintained JSON Schema, consumed only by the
`--capabilities` output (descriptive, not validating). A function-valued field is not
expressible in JSON Schema. `onlyIf` is added with a description and no JSON type
constraint, noting it is function-valued and configuration-file-only in the sense that it
cannot be expressed as data.

## Affected Artifacts

Per the project's Definition of Done.

### Spec (first, minor version bump → 4.2.0)

- `spec/01-task.md` — `Skipped` status, transition rules
- `spec/02-task-configuration.md` — `onlyIf` field, evaluation semantics
- `spec/04-execution.md` — `"skipped"` message type, worker flow step ordering vs cache
- `spec/11-events.md` — `onTaskSkipped`, hook mapping table, `afterTask` note
- `spec/13-reporting.md` — SKIPPED rendering and summary
- `spec/14-plugins.md` — hook mapping table
- `spec/CHANGELOG.md`, `spec/README.md` version

### Implementation

- `interfaces/task-configuration.ts`, `interfaces/task-configuration-schema.ts`
- `interfaces/registered-task.ts` (status enum), `interfaces/listener.ts`
- `engine/task-pool.ts`, `engine/worker.ts` (predicate evaluation, message type)
- `models/event-emitter.ts`, `models/execution-tracker.ts`
- `reporting/reporter.ts`, `reporting/agent-reporter.ts`
- `plugins/plugin-listener.ts`

### Derived

- `packages/docs/` — config reference entry, concepts coverage
- `packages/nadle/index.api.md` — regenerate after the export change
- Option-dump snapshots — expected unaffected (`onlyIf` is task configuration, not a
  resolved CLI option); verify rather than assume

## Testing

Integration-first, per project convention:

- Predicate returns false → task reports skipped, dependents still run.
- Predicate returns false → no cache entry written for that task.
- Predicate reads a file written by a dependency → confirms late evaluation.
- Predicate throws → task reports failed, run fails.
- Predicate returns true / field omitted → unchanged behavior.
- Async predicate resolving false → skipped.
