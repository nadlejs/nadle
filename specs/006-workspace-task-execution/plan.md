# Implementation Plan: Workspace Task Execution Improvements

**Branch**: `006-workspace-task-execution` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-workspace-task-execution/spec.md`

## Summary

Add implicit task dependencies derived from workspace `package.json` dependency relationships
(Gradle-style), root task aggregation, and refactor the scheduler for dependency injection to
enable heavy unit testing. The scheduler currently takes a monolithic `ProjectContext` that
couples it to the logger, task registry, and resolved options. This plan extracts pure
scheduling logic behind injectable interfaces, adds implicit dependency injection during DAG
analysis, and indexes task-by-name lookups for O(1) access.

## Technical Context

**Language/Version**: TypeScript 5.9.3, ESM only, target node22
**Primary Dependencies**: tinypool (worker threads), jiti (config loading), tsup (bundler)
**Storage**: N/A (in-memory DAG, filesystem cache via `.nadle/`)
**Testing**: vitest (thread pool, 20s timeout, retries: 5 CI / 2 local)
**Target Platform**: Ubuntu, macOS, Windows — Node 22/24
**Project Type**: Single package (`packages/nadle/`) within pnpm monorepo
**Performance Goals**: Scheduling <100ms for 500 tasks; transitive closure <50MB for 500 tasks
**Constraints**: Bundle size <140 KB; max 200 lines/file, 50 lines/function, complexity 10, 3 params
**Scale/Scope**: Typical monorepo 10-100 workspaces, stretch target 500 workspaces

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Status | Notes                                                                                                                                                                                                  |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I. Code Over Configuration            | PASS   | `implicitDependencies` is a boolean in `configure()` — TypeScript code, not YAML/JSON                                                                                                                  |
| II. Type Safety First                 | PASS   | New option typed in `NadleBaseOptions`; injectable interfaces use strict types; public API tracked by api-extractor                                                                                    |
| III. Lightweight and Focused          | PASS   | No new dependencies. Refactoring extracts interfaces, does not add abstractions beyond minimum. Index is a `Map` (built-in).                                                                           |
| IV. Integration-First Testing         | WATCH  | User requests heavy unit tests for scheduler. Constitution says "unit tests are permitted for isolated logic." Scheduler DAG logic qualifies. Integration tests remain primary; unit tests supplement. |
| V. Self-Hosting (Dogfooding)          | PASS   | Nadle builds itself — implicit deps will be exercised by self-build since root `nadle.config.ts` and workspace configs define tasks with dependencies.                                                 |
| VI. Modern ESM and Strict Conventions | PASS   | PascalCase node imports, no `process.cwd()`, `logger` abstraction.                                                                                                                                     |
| VII. Cross-Platform Correctness       | PASS   | No path handling changes. Workspace IDs already normalize separators.                                                                                                                                  |

**Technical Constraints Check:**

- Source file limits: New files designed to stay under 200 lines. Scheduler refactoring may split one 221-line file into 2-3 smaller files.
- Bundle size: No new deps, minimal code additions — within 140 KB budget.

**Post-Design Re-check**: Required after Phase 1 to verify unit test strategy stays within Constitution IV boundaries.

## Project Structure

### Documentation (this feature)

```text
specs/006-workspace-task-execution/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (TypeScript interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/nadle/src/core/
├── engine/
│   ├── task-scheduler.ts          # MODIFY: extract into DI-friendly design
│   ├── scheduler-types.ts         # NEW: injectable interfaces
│   ├── implicit-dependency-resolver.ts  # NEW: workspace->task dep logic
│   ├── task-pool.ts               # MODIFY: minor (no structural change)
│   └── worker.ts                  # UNCHANGED
├── options/
│   └── types.ts                   # MODIFY: add implicitDependencies field
├── registration/
│   └── task-registry.ts           # MODIFY: add name index (Map<name, tasks[]>)
├── handlers/
│   ├── execute-handler.ts         # MINOR: no structural change
│   └── dry-run-handler.ts         # MODIFY: show implicit vs explicit deps
├── models/project/
│   └── project.ts                 # UNCHANGED (workspace.dependencies already available)
└── nadle.ts                       # MODIFY: wire new option default

packages/nadle/test/
├── unit/
│   ├── task-scheduler.test.ts     # REWRITE: use injectable interfaces
│   ├── implicit-dependency-resolver.test.ts  # NEW: pure unit tests
│   └── ...
├── features/workspaces/
│   ├── workspaces-implicit-deps.test.ts      # NEW: integration tests
│   ├── workspaces-basic-tasks.test.ts        # UPDATE: verify no regressions
│   └── ...
└── ...

spec/
├── 03-scheduling.md               # UPDATE: document implicit deps, root aggregation
├── 07-workspace.md                 # UPDATE: note that workspace deps now create task deps
├── CHANGELOG.md                    # UPDATE: add entry
└── README.md                       # UPDATE: bump version to 1.5.0
```

**Structure Decision**: Existing single-package structure in `packages/nadle/`. New files
added within `core/engine/` for scheduler interfaces and implicit dependency resolution.
No new packages or directories outside existing structure.

## Architecture: Scheduler DI Refactoring

### Current Architecture (problematic for unit testing)

```text
TaskScheduler
  └── constructor(context: ProjectContext)
        ├── context.logger          (Logger — used for debug + throw)
        ├── context.taskRegistry    (TaskRegistry — getTaskById, getTaskByName, parse)
        └── context.options         (NadleResolvedOptions — parallel, tasks, excludedTasks)
```

The entire `ProjectContext` is passed, forcing tests to mock the full interface even though
the scheduler only uses 6 specific methods/properties.

### Target Architecture (injectable, testable)

```text
TaskScheduler
  └── constructor(deps: SchedulerDependencies)
        ├── deps.getTaskById(id) → { name, workspaceId, configResolver }
        ├── deps.getTasksByName(name) → TaskInfo[]
        ├── deps.parseTaskRef(input, workspaceId) → TaskIdentifier
        ├── deps.isRootWorkspace(workspaceId) → boolean
        ├── deps.getWorkspaceDependencies(workspaceId) → string[]
        ├── deps.logger → { debug, throw }
        └── deps.options → { parallel, implicitDependencies }

ImplicitDependencyResolver (pure function, no dependencies)
  └── resolve(taskId, taskName, workspaceId, deps) → Set<TaskIdentifier>
        ├── Looks up workspace dependencies
        ├── For each dep workspace, checks if same-name task exists
        ├── Returns set of implicit dependency task IDs
        └── Logs at debug level
```

**Key design decisions:**

1. `SchedulerDependencies` is a narrow interface — only what the scheduler actually needs
2. `ImplicitDependencyResolver` is a pure function — trivially testable with no mocks
3. The `Nadle` class implements `SchedulerDependencies` by delegating to its existing fields
4. Existing `ProjectContext` remains for backward compatibility; scheduler just narrows it
5. Root task aggregation is handled in `expandWorkspaceTasks()` by adding dependency edges

### Implicit Dependency Injection Point

Implicit dependencies are injected during `analyze()`, after resolving explicit `dependsOn`:

```text
analyze(taskId):
  1. Resolve explicit dependsOn → Set<TaskIdentifier>
  2. IF implicitDependencies enabled:
     a. Get workspace ID from task
     b. Get workspace dependencies (from package.json)
     c. For each dep workspace:
        - Check if same-name task exists in dep workspace
        - If yes AND not excluded AND not already in set → add to dependencies
        - Log at debug level: "Implicit dependency: {taskId} → {depTaskId}"
  3. Merge explicit + implicit (Set deduplicates automatically)
  4. Continue with DAG construction as before
```

### Root Task Aggregation

During `expandWorkspaceTasks()`, when a root task expands to include child workspace tasks:

```text
expandWorkspaceTasks(taskIds):
  for each taskId in taskIds:
    if task is from root workspace:
      for each same-name task in child workspaces:
        add to expanded list
      # NEW: record that root task depends on all expanded child tasks
      # This is stored and injected during analyze() as implicit deps
```

### Task-by-Name Index

In `TaskRegistry.configure()` (the finalization step), build a secondary index:

```text
private readonly nameIndex = new Map<string, RegisteredTask[]>();

configure(project):
  // existing: populate registry
  // NEW: build name index
  for each task in registry:
    nameIndex.get(task.name)?.push(task) ?? nameIndex.set(task.name, [task])

getTasksByName(name):
  return nameIndex.get(name) ?? []  // O(1) instead of O(n) filter
```

## Post-Design Constitution Re-check

| Principle                             | Status | Notes                                                                                                                                                                                                                                                                         |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Code Over Configuration            | PASS   | No change from pre-design check                                                                                                                                                                                                                                               |
| II. Type Safety First                 | PASS   | `SchedulerDependencies` is a strict TypeScript interface; `implicitDependencies` is typed `boolean` in `NadleBaseOptions`; api-extractor will track the new public option                                                                                                     |
| III. Lightweight and Focused          | PASS   | No new deps. `scheduler-types.ts` is ~50 lines of interfaces. `implicit-dependency-resolver.ts` is ~40 lines. Both well under limits.                                                                                                                                         |
| IV. Integration-First Testing         | PASS   | Unit tests for scheduler and implicit resolver are justified as "isolated logic" per constitution. Integration tests (`workspaces-implicit-deps.test.ts`) remain the primary validation. Unit tests supplement with edge case coverage (diamond deps, cycles, deduplication). |
| V. Self-Hosting (Dogfooding)          | PASS   | Nadle's own monorepo has workspace dependencies — implicit deps will exercise the feature during self-build                                                                                                                                                                   |
| VI. Modern ESM and Strict Conventions | PASS   | All new files are ESM, use `logger` abstraction, no `process.cwd()`                                                                                                                                                                                                           |
| VII. Cross-Platform Correctness       | PASS   | No path operations. Workspace IDs already normalized.                                                                                                                                                                                                                         |

**Technical Constraints:**

- `task-scheduler.ts` (221 lines) will be split: ~150 lines scheduler + ~40 lines implicit resolver + ~50 lines types = all under 200 lines
- Functions stay under 50 lines: `analyze()` is the longest at ~30 lines currently, adding implicit dep resolution adds ~10 lines (still under 50)
- Max 3 params: `SchedulerDependencies` is a single object parameter. `ImplicitDependencyResolver` takes 4 params but is a type alias for a function, not a class method — can be restructured to take a context object if needed.

**Verdict**: All gates pass. No violations to track.

## Implementation Phases (for `/speckit.tasks`)

### Phase 1: Foundation — Scheduler DI Refactoring

1. Create `scheduler-types.ts` with `SchedulerDependencies`, `SchedulerTask`, `SchedulerLogger`, `SchedulerOptions` interfaces
2. Refactor `TaskScheduler` constructor to accept `SchedulerDependencies` instead of `ProjectContext`
3. Update `Nadle` class to satisfy `SchedulerDependencies` structurally (adapter methods)
4. Rewrite `task-scheduler.test.ts` using the new injectable interface — verify all existing test cases pass
5. Add `implicitDependencies` field to `NadleBaseOptions`, `NadleFileOptions`, `NadleResolvedOptions` (default `true`)
6. Add default in `OptionsResolver.defaultOptions`

### Phase 2: Core Feature — Implicit Dependencies

7. Add `nameIndex` to `TaskRegistry` for O(1) `getTasksByName()` lookups
8. Create `implicit-dependency-resolver.ts` — pure function resolving workspace deps to task deps
9. Integrate implicit deps into `TaskScheduler.analyze()` (after explicit `dependsOn` resolution)
10. Add root task aggregation in `expandWorkspaceTasks()` (root task depends on all expanded child tasks)
11. Write unit tests for `ImplicitDependencyResolver` — linear chain, diamond, missing tasks, excluded tasks, opt-out
12. Write unit tests for scheduler with implicit deps — cycle detection, deduplication, root aggregation

### Phase 3: Observability & Polish

13. Add debug logging for implicit dependency injection
14. Update dry-run handler to annotate implicit vs explicit dependencies
15. Add `configure({ implicitDependencies: false })` opt-out support (wire through to scheduler)

### Phase 4: Integration Tests & Specification

16. Write integration tests (`workspaces-implicit-deps.test.ts`) — linear chain, diamond, cycle error, opt-out, excluded, missing upstream tasks, root aggregation
17. Verify existing workspace tests pass (no regressions)
18. Update `spec/03-scheduling.md` — add implicit dependency section, root aggregation
19. Update `spec/07-workspace.md` — note workspace deps now create task deps by default
20. Update `spec/CHANGELOG.md` and bump `spec/README.md` version to 1.5.0
21. Update user-facing docs (`packages/docs/`) if they exist for workspaces
22. Run `npx nadle build` to regenerate `index.api.md` with new public API surface
23. Verify bundle size stays under 140 KB
