# 03 — Scheduling

Nadle schedules tasks by constructing a directed acyclic graph (DAG) from declared
dependencies, then processes the graph using a topological-sort-based algorithm.

## DAG Construction

The scheduler maintains three internal graphs:

| Graph                       | Key -> Value                                       | Purpose                                          |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| Dependency graph            | taskId -> set of dependency taskIds                | Direct dependencies of each task.                |
| Transitive dependency graph | taskId -> set of all transitive dependency taskIds | Full closure used for sequential mode filtering. |
| Dependents graph (reverse)  | taskId -> set of dependent taskIds                 | Reverse edges for indegree updates.              |

Additionally, an **indegree map** tracks the number of unresolved dependencies for each
task.

### Analysis Phase

For each requested task (and its transitive dependencies):

1. Resolve `dependsOn` from the task's configuration.
2. Filter out excluded tasks.
3. Record edges in the dependency and dependents graphs.
4. Recursively analyze each dependency.
5. Build transitive closure in the transitive dependency graph.

## Cycle Detection

After analysis, cycles are detected using depth-first traversal. For each task, the
scheduler walks its dependency chain. If a task is encountered that already exists in the
current path, a cycle is detected.

- If a cycle is found, Nadle raises an error that includes the full cycle path
  (e.g., `a -> b -> c -> a`).
- Cycle detection runs before any task execution begins.

## Workspace Task Expansion

When a task is specified at the root workspace level and child workspaces have tasks
with the same name, Nadle automatically expands the request to include the matching
child workspace tasks. This only applies to tasks registered in the root workspace.

## Implicit Workspace Dependencies

When `implicitDependencies` is enabled (the default), Nadle automatically creates task
dependency edges based on workspace dependency relationships declared in `package.json`.

### Resolution Rules

For each non-root task being analyzed, Nadle examines the workspace's dependency list
(populated from `package.json` — see [07-workspace.md](07-workspace.md)). For each
upstream workspace, if it defines a task with the **same name**, an implicit dependency
edge is added so the upstream task runs first.

- Implicit edges are **additive**: they combine with any explicit `dependsOn` declarations.
- Implicit edges respect `--exclude`: if the upstream task is excluded, no edge is created.
- **Deduplication**: if an explicit `dependsOn` already targets the same upstream task,
  the implicit edge is a no-op (no duplicate edge).
- Implicit dependencies are only resolved for tasks within child workspaces. Root workspace
  tasks are not subject to implicit dependency resolution (they have no upstream workspaces).
- If the upstream workspace has no task with the matching name, the edge is silently skipped.

### Root Task Aggregation

When workspace task expansion adds child workspace tasks for a root task (see above),
and `implicitDependencies` is enabled, the root task automatically depends on **all**
expanded child workspace tasks. This ensures the root task runs last, after all child
workspace instances of the same task have completed.

- Aggregation edges respect `--exclude`: excluded child tasks are not added as dependencies.
- Aggregation combines with implicit workspace dependencies: child tasks respect their own
  inter-workspace ordering, and the root task waits for all of them.
- Aggregation is disabled when `implicitDependencies` is `false`.

### Opt-Out

Set `implicitDependencies: false` via `configure()` or CLI flag to disable all implicit
dependency behavior, including both workspace dependency edges and root task aggregation.

## Execution Modes

### Parallel Mode (`--parallel`)

All requested tasks and their dependencies are considered together. Any task whose
indegree reaches zero is immediately eligible for execution.

- The scheduler does not restrict which zero-indegree tasks can run.
- All ready tasks from all requested task trees run concurrently.

### Sequential Mode (default)

Tasks are processed one "main task" at a time, in the order they were specified on
the command line.

1. The first specified task becomes the **main task**.
2. Only tasks that are the main task or within its transitive dependency tree are
   eligible for scheduling.
3. Within the main task's tree, all zero-indegree tasks run concurrently (dependencies
   within a chain step still parallelize).
4. When the main task completes, the scheduler advances to the next specified task (see
   [Failure Handling](#failure-handling) for what completion means when a task in the tree
   has failed).
5. If the next main task's dependencies are already satisfied, it may start immediately.

### Ready Task Computation (Kahn's Algorithm)

1. **Initial**: all tasks with indegree zero in the eligible set are "ready."
2. **On completion**: for each dependent of the completed task, decrement its indegree.
   If the dependent's indegree reaches zero and it belongs to the current eligible set,
   it becomes ready.
3. **Main task completion** (sequential mode only): advance to the next main task and
   recompute the initial ready set. See [Failure Handling](#failure-handling) for what
   completion means when a task in the tree has failed.

## Failure Handling

When a task fails, the scheduler decides whether the run stops admitting new work or
keeps going. The decision is governed by the `--continue` option.

### Fail-Fast (default)

By default the run **fails fast**: as soon as any task fails, the scheduler stops
admitting tasks to execution. No task that has not already started is started, whether or
not it depends on the failure. Tasks already in flight reach a terminal status under the
rules of [04-execution.md](04-execution.md) and are reported.

### Continue (`--continue`)

With `--continue`, a failure does not stop the scheduler. The run proceeds until no task
can be admitted any more:

- A task whose dependencies have **all** succeeded is still admitted and executed, however
  many unrelated tasks have failed.
- A task that has at least one **failed** task in its transitive dependency closure is
  **never** admitted — running it would consume outputs that were not produced. Because the
  closure is transitive, a task whose only unmet dependency is itself blocked is likewise
  never admitted: the original failure is in its closure too.
- Succeeding after a failure does not clear the failure: the run's outcome is still a
  failure, the exit code is non-zero, and **every** failure is reported, not just the first
  (see [12-error-handling.md](12-error-handling.md)).
- `--continue` changes admission only. It changes neither the dependency order, the
  concurrency limits, nor any cache decision — in particular, a task that succeeds during a
  failed run has its result cached normally, because cache writes are gated on the task's
  own outcome, not the run's (see [05-caching.md](05-caching.md)).

The option is independent of the execution mode. It composes with parallel and sequential
mode as described below.

### Terminal Non-Execution States

When a run ends, every task that was scheduled but never reached a terminal status is
classified into exactly one of two states. The classification is a property of the graph
and the set of failures, not a task status: these tasks never started and therefore never
reach a terminal status (see [01-task.md](01-task.md)).

| State       | Definition                                                                            |
| ----------- | ------------------------------------------------------------------------------------- |
| Blocked     | At least one task in the task's transitive dependency closure failed.                 |
| Not started | No task in its transitive dependency closure failed, and the run ended before it ran. |

Rules:

- The two states are mutually exclusive and jointly exhaustive over the tasks that were
  scheduled and never reached a terminal status. Every such task is either blocked or not
  started.
- **Blocked** is decided by the graph alone. A task is blocked if and only if a failure
  exists in its transitive dependency closure, independently of `--continue`. A blocked
  task is blocked under both fail-fast and `--continue`; skipping it is always correct.
- **Not started** means the task was independent of every failure. Under `--continue` this
  set is empty for tasks whose dependencies could still be satisfied — the whole point of
  the option is that such a task runs. It remains non-empty when the run is aborted for a
  reason other than a task failure.
- Neither state is the `Canceled` status. `Canceled` describes a task that **was running**
  and was terminated before it completed; blocked and not-started tasks never started.
- A task excluded from the run (see Exclusion) is not scheduled at all and is therefore
  neither blocked nor not started.

The two states are reported as separate counts — see [13-reporting.md](13-reporting.md).

### Interaction with Execution Modes

**Parallel mode.** Admission is graph-wide. Under `--continue`, any task whose indegree has
reached zero and whose transitive dependency closure holds no failure is admitted, so
independent branches of unrelated main tasks continue concurrently with the failure.

**Sequential mode.** The scheduler restricts eligibility to the current main task's tree.
Under `--continue`, a failure inside that tree does not end the run:

1. Within the current main task's tree, admission continues under the same rule — every
   task whose dependencies all succeeded is still run.
2. The main task is considered complete once no task in its tree can be admitted any more
   **and** no task in its tree is still running. Waiting for the running tasks is what
   makes the rule correct: a tree whose tasks are all in flight has nothing admissible at
   that instant, yet each pending completion may still admit its dependents. The main task
   is complete whether it reached a terminal status successfully or is itself blocked by a
   failure beneath it.
3. The scheduler then **advances to the next main task** and proceeds normally. A failure
   in main task 1 therefore does not prevent main task 2 from running, unless main task 2
   transitively depends on a task that failed — in which case main task 2 is blocked by the
   ordinary rule, not by the mode.

This is the behavior the option exists for: a gate that lists several independent checks as
main tasks gets a verdict for each of them in one run. Under the default fail-fast
behavior, a failure in main task 1 ends the run and main task 2 is reported as not started.

## Exclusion

Tasks specified via `--exclude` are removed from consideration during analysis. They are
filtered out of dependency sets, so they and their exclusive subtrees are not scheduled.

## Execution Plan

The execution plan is the ordered list of tasks produced by simulating Kahn's algorithm
to completion. This plan is used by dry-run mode to display the intended execution order.
