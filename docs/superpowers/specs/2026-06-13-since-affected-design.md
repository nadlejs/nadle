# `nadle <tasks> --since <ref>` (Affected-Only Execution) Design

**Status:** Approved (self-driven; user directed "do features, don't ask").
**Issue:** [#646](https://github.com/nadlejs/nadle/issues/646) — run only tasks affected by a git diff.

## Goal

`nadle test --since main` runs only the requested tasks that are **affected** by the
files changed since a git ref — the table-stakes monorepo-CI feature (Turborepo's
`--filter ...[ref]`, Nx's `affected`). Unaffected requested tasks are skipped.

## Definition of "affected"

A scheduled task is **directly affected** if a changed file falls within its
workspace directory (`workspace.absolutePath`). This is the workspace-locality model:
a change dirties its containing workspace, no per-task `inputs` declaration required.

**A task runs iff it is directly affected, plus the dependencies a directly-affected
task needs to run.** So `nadle build --since main` runs `build` in exactly the
workspaces whose files changed, plus any dependency tasks those builds require. The
aggregating root task (`build` expanded across all workspaces) naturally drops to
just the affected children.

Rationale for workspace-dir containment (not input-glob matching) as the signal:
most tasks don't declare `inputs`, and requiring them would make `--since` silently
skip everything. Workspace containment always works.

### Not included: cross-workspace dependent propagation

If package B depends on package A and only A changed, B's task is **not** run unless
B's own workspace also changed. Full dependent propagation (rebuild B because its
dependency A changed) needs the workspace-dependency graph, which is separate from the
task graph, and is deferred to a follow-up. The workspace-locality model is the simple,
predictable first cut; a directly-affected task still pulls in its own dependencies so
its inputs are produced.

### Edge cases

- **Root-workspace changes** (files at the repo root, outside any sub-workspace, e.g.
  the root `nadle.config.ts`, root `package.json`): treat as dirtying the **root
  workspace**. Root-workspace tasks and anything depending on them become affected.
  A changed shared config legitimately affects everything downstream.
- **A changed file in no workspace** (e.g. `.github/`, `docs/`): does not dirty any
  workspace by itself. (Conservative; avoids running everything on a CI-config tweak.
  If users want those tracked they belong to the root workspace dir anyway.)
- **No changed files** (ref == HEAD, clean tree): nothing affected → no tasks run →
  a clear "no tasks affected since <ref>" message, exit 0.
- **Invalid ref / not a git repo / git missing**: `git diff` fails → surface a
  `ConfigurationError` with the git stderr; do not silently run everything.

## CLI surface

```
nadle test --since main
nadle build test --since HEAD~3
```

`--since <ref>` is a string option. It only applies to the default Execute path —
combining it with `--graph`/`--explain`/`--list` is meaningless (those don't run
tasks); since those handlers match first in the chain, `--since` is simply ignored
there, which is acceptable. With `--watch`, `--since` is ignored (watch re-runs the
explicit set); document as out-of-scope for now.

## Architecture / files

- **`core/options/cli-options.ts`** — add `since: { key: "since", options: { type:
"string", description: "Run only tasks affected by changes since a git ref" } }`.
  Group under "Execution options:" in `cli.ts`.
- **`core/options/types.ts`** — `NadleCLIOptions.since?: string`; omit from the
  `Required<>` of `NadleResolvedOptions` and redeclare `since?: string` (same shape
  as `graph`/`explain`).
- **`core/engine/affected.ts`** — new module, the testable core:
  - `getChangedFiles(ref, cwd): Promise<string[]>` — runs `git diff --name-only <ref>`
    via `node:child_process` execFile (promisified), returns absolute paths
    (resolve each against the git repo root from `git rev-parse --show-toplevel`, or
    against cwd). Throws `ConfigurationError` on git failure.
  - `computeAffectedTasks({ changedFiles, workspaceDirs, scheduledTasks,
getWorkspaceId, getTransitiveDependencies }): string[]` — pure given its injected
    lookups; no I/O. Over the full scheduled set, a task is directly affected when a
    changed file lies within its workspace directory; the result is the directly
    affected tasks plus the dependencies they need. Pure (deps injected as plain
    functions) so it is unit-testable without git or a real project.
- **`core/handlers/execute-handler.ts`** — when `options.since` is set and there are
  chosen tasks: init the scheduler once to get the expanded graph, compute changed
  files, compute the affected task set, then re-init the scheduler with only those
  tasks. If none affected, log the no-tasks-affected notice and return. (Re-init is
  safe because `init()` now resets its derived graph state — see below.)

### Why filter in ExecuteHandler

It is the cleanest seam (confirmed): `options.tasks` are already resolved, the full
context (project, registry, scheduler) is available, and it is before the pool runs —
the same place watch-mode re-derives its set. No scheduler/worker change needed beyond
a small public accessor for transitive dependencies (see below).

### Scheduler accessor + idempotent init

`computeAffectedTasks` needs each task's dependency set to pull in the deps an affected
task requires. The scheduler computes `transitiveDependencyGraph` (private); expose:

```ts
public getTransitiveDependencies(taskId: TaskIdentifier): ReadonlySet<TaskIdentifier> {
  return this.transitiveDependencyGraph.get(taskId);
}
```

Because the handler re-inits the shared scheduler (once for the affected pre-pass, once
for the real run), `init()` now begins with a `reset()` that clears all derived graph
state (dependency/dependents/transitive maps, indegree, ready set, implicit edges).
This makes re-init idempotent — and also makes the watch loop's per-cycle re-init
start from a clean graph rather than stale indegree values.

## Determining a task's workspace directory

`task.workspaceId` → `getWorkspaceById(project, workspaceId).absolutePath`. A changed
file `f` dirties workspace `w` iff `f` is within `w.absolutePath`. To attribute a file
to the **most specific** workspace (nested packages), pick the workspace with the
**longest** `absolutePath` that is a prefix of `f` (path-segment-aware, so `/a/pkg`
does not match `/a/pkg-other`). Files matching no sub-workspace fall to the root
workspace only if they are under the root and not under any sub-workspace.

## Testing

Integration-first, with a real git fixture (the harness can `git init` a temp dir).
If the harness can't easily drive git, unit-test the pure core and integration-test
the wiring with an injected changed-file list.

- **`test/unit/affected.test.ts`** — `computeAffectedRoots` with hand-built inputs:
  - a changed file in workspace A → task in A affected.
  - a changed file in A, requested root in B depends on A → B affected.
  - a changed file in an unrelated workspace C → root in B not affected.
  - root-config change (root workspace) → everything affected.
  - no changed files → empty result.
- **`test/options/since.test.ts`** — integration: a multi-workspace fixture, `git
init` + commit, modify one package's file, `nadle <task> --since HEAD` runs only the
  affected package's task; a clean tree prints "no tasks affected".
  - invalid ref → error mentioning git's message.

If driving real git in the integration harness proves flaky cross-platform (Windows
CI), fall back to exercising `computeAffectedRoots` thoroughly in unit tests and a
single smoke integration test guarded for git availability.

## Snapshot impact

No resolved-options dump change that isn't redacted (#658 covers builtin-task/help).
A new `--since` flag DOES appear in `--help`, so the help snapshot regenerates (one
file). show-config/config-key dumps gain `since` — regenerate those two alone with
`-u` and verify `CI=true`. No failure-path snapshots touched.

## Out of scope (YAGNI)

- Input-glob-level affectedness refinement (workspace-dir containment is enough now).
- `--since` with `--watch` (ignored).
- Remote/base-branch auto-detection, merge-base computation beyond what `git diff
<ref>` already does (users pass the ref they want; `git diff main` already diffs
  against the merge-base-ish working tree).
- Caching the changed-file list (one git call per run is negligible).
