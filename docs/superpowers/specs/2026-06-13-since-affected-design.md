# `nadle <tasks> --since <ref>` (Affected-Only Execution) Design

**Status:** Approved (self-driven; user directed "do features, don't ask").
**Issue:** [#646](https://github.com/nadlejs/nadle/issues/646) — run only tasks affected by a git diff.

## Goal

`nadle test --since main` runs only the requested tasks that are **affected** by the
files changed since a git ref — the table-stakes monorepo-CI feature (Turborepo's
`--filter ...[ref]`, Nx's `affected`). Unaffected requested tasks are skipped.

## Definition of "affected"

A scheduled task is **directly affected** if a changed file falls within its
workspace directory (`workspace.absolutePath`). This is the Turborepo/Nx model:
a change dirties its containing workspace, no per-task `inputs` declaration required.

A **requested root task runs** iff the task itself or any task in its dependency
subtree is directly affected. Affectedness flows from a changed (dirty) dependency
up to its dependents: if `test` depends on `build` and `build`'s workspace changed,
`test` is affected.

Rationale for workspace-dir containment (not input-glob matching) as the primary
signal: most tasks don't declare `inputs`, and requiring them would make `--since`
silently skip everything. Workspace containment always works. Input declarations
could refine this later (a follow-up), but coarser-but-correct beats precise-but-empty.

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
  - `computeAffectedRoots({ roots, changedFiles, project, getDependencies, getWorkspaceId }):
    string[]` — pure given its injected lookups; no I/O. For each scheduled task,
    decide directly-affected by workspace-dir containment; a root is affected if it or
    any transitive dependency is directly affected. Returns the affected subset of
    `roots`.
  Keeping `computeAffectedRoots` pure (deps injected as plain functions) makes it
  unit-testable without git or a real project.
- **`core/handlers/execute-handler.ts`** — when `options.since` is set and there are
  chosen tasks: build the scheduler once to get the dependency graph, compute changed
  files, compute affected roots, then re-init the scheduler with only the affected
  roots. If none affected, log "no tasks affected since <ref>" and return.

### Why filter in ExecuteHandler

It is the cleanest seam (confirmed): `options.tasks` are already resolved, the full
context (project, registry, scheduler) is available, and it is before the pool runs —
the same place watch-mode re-derives its set. No scheduler/worker change needed beyond
a small public accessor for transitive dependencies (see below).

### Scheduler accessor

`computeAffectedRoots` needs each task's full dependency set. The scheduler already
computes `transitiveDependencyGraph` (private). Add a public method:

```ts
public getTransitiveDependencies(taskId: TaskIdentifier): ReadonlySet<TaskIdentifier> {
  return this.transitiveDependencyGraph.get(taskId);
}
```

Then a root is affected iff `root` is directly-affected OR any id in
`getTransitiveDependencies(root)` is directly-affected.

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
