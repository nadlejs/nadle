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
4. When the main task completes, the scheduler advances to the next specified task.
5. If the next main task's dependencies are already satisfied, it may start immediately.

### Ready Task Computation (Kahn's Algorithm)

1. **Initial**: all tasks with indegree zero in the eligible set are "ready."
2. **On completion**: for each dependent of the completed task, decrement its indegree.
   If the dependent's indegree reaches zero and it belongs to the current eligible set,
   it becomes ready.
3. **Main task completion** (sequential mode only): advance to the next main task and
   recompute the initial ready set.

## Exclusion

Tasks specified via `--exclude` are removed from consideration during analysis. They are
filtered out of dependency sets, so they and their exclusive subtrees are not scheduled.

## Execution Plan

The execution plan is the ordered list of tasks produced by simulating Kahn's algorithm
to completion. This plan is used by dry-run mode to display the intended execution order.
