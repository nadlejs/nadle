# Data Model: Workspace Task Execution Improvements

**Feature**: 006-workspace-task-execution
**Date**: 2026-02-22

## Entities

### SchedulerDependencies (NEW — injectable interface)

Narrow interface that `TaskScheduler` depends on, replacing the monolithic `ProjectContext`.

| Field                      | Type                                                     | Description                                          |
| -------------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| `getTaskById`              | `(id: TaskIdentifier) => SchedulerTask`                  | Fetches task info by ID                              |
| `getTasksByName`           | `(name: string) => SchedulerTask[]`                      | Fetches all tasks with given name (O(1) indexed)     |
| `parseTaskRef`             | `(input: string, workspaceId: string) => TaskIdentifier` | Resolves dependency string to task ID                |
| `isRootWorkspace`          | `(workspaceId: string) => boolean`                       | Checks if workspace is root                          |
| `getWorkspaceDependencies` | `(workspaceId: string) => readonly string[]`             | Returns workspace IDs that this workspace depends on |
| `logger`                   | `SchedulerLogger`                                        | Narrow logger interface (debug + throw)              |
| `options`                  | `SchedulerOptions`                                       | Narrow options subset                                |

### SchedulerTask (NEW — minimal task view for scheduler)

| Field            | Type                      | Description                                    |
| ---------------- | ------------------------- | ---------------------------------------------- |
| `id`             | `TaskIdentifier`          | Unique task identifier                         |
| `name`           | `string`                  | Task name (without workspace prefix)           |
| `workspaceId`    | `string`                  | Owning workspace ID                            |
| `configResolver` | `() => TaskConfiguration` | Returns resolved task config (for `dependsOn`) |

### SchedulerLogger (NEW — narrow logger for scheduler)

| Field   | Type                           | Description               |
| ------- | ------------------------------ | ------------------------- |
| `debug` | `(...args: unknown[]) => void` | Debug-level logging       |
| `throw` | `(message: string) => never`   | Throws a structured error |

### SchedulerOptions (NEW — narrow options for scheduler)

| Field                  | Type      | Description                                               |
| ---------------------- | --------- | --------------------------------------------------------- |
| `parallel`             | `boolean` | Whether parallel execution mode is enabled                |
| `implicitDependencies` | `boolean` | Whether workspace deps create task deps (default: `true`) |

### NadleBaseOptions (MODIFIED)

Added field:

| Field                  | Type      | Default | Description                                         |
| ---------------------- | --------- | ------- | --------------------------------------------------- |
| `implicitDependencies` | `boolean` | `true`  | Enable/disable implicit workspace task dependencies |

### NadleFileOptions (MODIFIED)

Inherits `implicitDependencies` from `NadleBaseOptions` via `Partial<NadleBaseOptions>`.
No additional changes needed.

### NadleResolvedOptions (MODIFIED)

`implicitDependencies` becomes `Required<boolean>` (always resolved, defaults to `true`).

### TaskRegistry (MODIFIED)

Added internal index:

| Field                 | Type                            | Description                                      |
| --------------------- | ------------------------------- | ------------------------------------------------ |
| `nameIndex` (private) | `Map<string, RegisteredTask[]>` | Index from task name to all tasks with that name |

Modified methods:

- `configure()`: Builds `nameIndex` after populating registry
- `getTaskByName()`: Uses `nameIndex` for O(1) lookup instead of O(n) filter

## Relationships

```text
Nadle (container)
  ├── implements SchedulerDependencies (structurally)
  ├── owns TaskRegistry
  │     └── provides getTaskById, getTasksByName, parseTaskRef
  ├── owns NadleResolvedOptions
  │     └── provides parallel, implicitDependencies
  └── creates TaskScheduler(deps: SchedulerDependencies)
        ├── uses ImplicitDependencyResolver (pure function)
        └── builds DAG with explicit + implicit edges

ImplicitDependencyResolver
  └── inputs: taskId, taskName, workspaceId, deps (SchedulerDependencies subset)
  └── output: Set<TaskIdentifier> (implicit dependencies for this task)
```

## State Transitions

No new task status states. Implicit dependencies affect the DAG structure (edge additions)
but do not introduce new lifecycle states. The existing status lifecycle remains unchanged:

```text
Registered → Scheduled → Running → Finished/Failed/Canceled
                 ├─→ UpToDate
                 └─→ FromCache
```

## Dependency Edge Classification

Each edge in the dependency graph now has an implicit origin classification:

| Origin                 | Source                        | Example                                                 |
| ---------------------- | ----------------------------- | ------------------------------------------------------- |
| Explicit               | `dependsOn` in task config    | `task("build").config({ dependsOn: ["check"] })`        |
| Implicit (workspace)   | Workspace `package.json` deps | `app` depends on `lib` → `lib:build` before `app:build` |
| Implicit (aggregation) | Root task expansion           | Root `build` depends on all child `build` tasks         |

For dry-run output, edges are annotated with their origin. For execution, all edges are
treated identically — the classification is metadata for observability only.
