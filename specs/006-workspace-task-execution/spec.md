# Feature Specification: Workspace Task Execution Improvements

**Feature Branch**: `006-workspace-task-execution`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Improve how tasks run within project and nested workspaces. Is the current impl task order correct, what can be improved, is this aligned with Gradle, what we do better, is this detect cycle correct, any perf issues. How the sub project 'build' tasks run when calling 'build' task from root."

## Clarifications

### Session 2026-02-22

- Q: Should `implicitDependencies` default to `true` immediately (breaking change) or be opt-in first? → A: Default `true` immediately — accept the breaking change to match Gradle behavior from day one. No phased rollout.
- Q: Should root task implicitly depend on all expanded same-name child workspace tasks (Gradle aggregation)? → A: Yes — root task acts as aggregation point, implicitly depending on all expanded child workspace tasks with the same name. Root `build` runs after all workspace `build` tasks complete.
- Q: Which `package.json` dependency fields should create implicit task dependencies? → A: All four fields (`dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`) — consistent with existing workspace dependency resolution.
- Q: Should Nadle log implicit dependency injections during normal (non-dry-run) execution? → A: Log at `debug` level only (visible with `--log-level debug`), showing each injected implicit dependency. Default output stays clean.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Implicit Task Dependencies from Workspace Dependencies (Priority: P1)

When a monorepo has workspace dependency relationships (e.g., `packages/app` depends on
`packages/lib` via `workspace:*` in `package.json`), running a task like `build` from the
root should automatically respect those workspace dependencies. If `app` depends on `lib`,
then `lib:build` should complete before `app:build` starts — without requiring the user to
explicitly declare `dependsOn: ["packages:lib:build"]` in every workspace config.

Today, workspace dependencies are informational only and do not create task dependencies.
This forces users to manually wire cross-workspace task dependencies, which is error-prone
and tedious in large monorepos. Gradle solves this with automatic project-to-task dependency
propagation.

**Why this priority**: This is the single most impactful improvement for monorepo users. It
eliminates a whole class of configuration boilerplate and prevents subtle build ordering bugs
where a downstream package builds against stale outputs from an upstream dependency.

**Independent Test**: Can be fully tested by creating a monorepo where `app` depends on `lib`,
registering a `build` task in both, running `nadle build` from root, and verifying `lib:build`
completes before `app:build` starts.

**Acceptance Scenarios**:

1. **Given** a monorepo where workspace `app` depends on workspace `lib` (via `workspace:*`),
   and both workspaces define a `build` task,
   **When** the user runs `nadle build` from the root,
   **Then** `lib:build` completes before `app:build` starts.

2. **Given** a monorepo with a diamond dependency (`app` depends on `lib-a` and `lib-b`, both
   depend on `core`), and all four workspaces define a `build` task,
   **When** the user runs `nadle build` from the root,
   **Then** `core:build` completes before `lib-a:build` and `lib-b:build`, and both `lib-a:build`
   and `lib-b:build` complete before `app:build`.

3. **Given** a monorepo with workspace dependencies, and a workspace explicitly declares
   `dependsOn` for the same task that would be implied by workspace dependencies,
   **When** the user runs the task,
   **Then** the explicit dependency is honored and no duplicate edges are created in the DAG.

4. **Given** a monorepo where workspace `app` depends on workspace `lib`, but `lib` does NOT
   define a `build` task,
   **When** the user runs `nadle build` from the root,
   **Then** `app:build` runs without error (missing upstream tasks are silently skipped, not
   treated as failures).

5. **Given** a monorepo where the user wants to opt out of implicit workspace task dependencies,
   **When** the user configures `configure({ implicitDependencies: false })` in the root config,
   **Then** workspace dependencies do not create task dependencies (current behavior preserved).

---

### User Story 2 - Workspace-Aware Task Ordering for Root Invocations (Priority: P2)

When running a task from the root workspace that expands to include child workspace tasks,
the expansion should produce a deterministic, dependency-respecting order. Currently, workspace
tasks are expanded in the order they appear in the sorted workspace list (by relative path).
This does not account for workspace dependency relationships, meaning the topological sort
alone must resolve the ordering — but only if explicit `dependsOn` declarations exist.

With implicit dependencies (Story 1), this becomes automatic. Without them, the expansion
order should still be predictable and documented.

**Why this priority**: Users expect `nadle build` to "just work" in a monorepo. Deterministic
ordering builds confidence and makes debugging easier.

**Independent Test**: Can be tested by creating a monorepo with known workspace dependencies
and verifying the execution order matches the expected topological order.

**Acceptance Scenarios**:

1. **Given** a monorepo with workspaces `a`, `b`, `c` where `c` depends on `b` and `b` depends
   on `a`, and all define a `build` task,
   **When** the user runs `nadle build` from the root,
   **Then** execution order is `a:build` -> `b:build` -> `c:build`.

2. **Given** a monorepo with independent workspaces `x` and `y` (no dependencies between them),
   **When** the user runs `nadle build` from the root in parallel mode,
   **Then** `x:build` and `y:build` may execute concurrently.

3. **Given** a monorepo where root defines a `build` task and child workspaces `lib` and `app`
   also define `build`,
   **When** the user runs `nadle build` from the root,
   **Then** root `build` runs last — after all child workspace `build` tasks complete
   (root task acts as an aggregation point).

4. **Given** a monorepo with workspaces where root defines a `build` task with
   `dependsOn: ["check"]` and child workspaces also define `build`,
   **When** the user runs `nadle build` from the root,
   **Then** root `check` completes before root `build`, workspace builds respect workspace
   dependency ordering, and root `build` runs after both root `check` and all workspace
   `build` tasks complete.

---

### User Story 3 - Cycle Detection Robustness with Workspace Expansion (Priority: P2)

Cycle detection must correctly handle cycles that emerge from the combination of explicit
`dependsOn` declarations and implicit workspace dependency propagation. A cycle that only
becomes visible after workspace task expansion must still be detected and reported with a
clear error message showing the full cycle path.

**Why this priority**: Incorrect cycle detection (false positives or missed cycles) breaks
user trust in the tool. This is critical for correctness.

**Independent Test**: Can be tested by creating workspace dependency configurations that
produce cycles only when implicit dependencies are applied, and verifying the error message.

**Acceptance Scenarios**:

1. **Given** workspace `a:build` explicitly depends on `b:test`, and `b:test` explicitly
   depends on `a:build`,
   **When** the user runs any task that includes both,
   **Then** Nadle reports a cycle: `a:build -> b:test -> a:build`.

2. **Given** implicit workspace dependencies would create `lib:build -> app:build`, and
   `app:build` explicitly declares `dependsOn: ["packages:lib:build"]` creating a redundant
   edge,
   **When** the user runs `nadle build`,
   **Then** no cycle is reported (redundant edges are deduplicated).

3. **Given** implicit workspace dependencies would create a cycle (workspace `a` depends on
   `b` and `b` depends on `a` in `package.json`),
   **When** the user runs `nadle build`,
   **Then** Nadle reports the cycle with the full path including workspace context.

---

### User Story 4 - Performance for Large Monorepos (Priority: P3)

The scheduling algorithm should remain performant for monorepos with hundreds of workspaces
and thousands of tasks. The current transitive closure computation is O(V\*E) worst case,
which could become a bottleneck. Task registry lookups by name are O(n) linear scans.

**Why this priority**: While most monorepos have 10-100 workspaces, Nadle should scale
gracefully to larger setups without degradation.

**Independent Test**: Can be tested by benchmarking scheduling time with synthetic monorepos
of increasing size (50, 100, 500 workspaces).

**Acceptance Scenarios**:

1. **Given** a monorepo with 100 workspaces, each defining 5 tasks (500 total tasks),
   **When** the user runs `nadle build` from the root,
   **Then** scheduling (DAG construction + cycle detection) completes in under 100 milliseconds.

2. **Given** a monorepo with complex cross-workspace dependencies (dense graph),
   **When** the user runs a task,
   **Then** memory usage for the transitive closure does not exceed 50 MB for 500 tasks.

3. **Given** frequent calls to find tasks by name during workspace expansion,
   **When** the scheduler expands root tasks,
   **Then** task-by-name lookups use indexed access (not linear scans).

---

### User Story 5 - Dry-Run Visibility for Workspace Task Ordering (Priority: P3)

Users should be able to preview the exact execution order that workspace task expansion and
implicit dependencies produce, before committing to a full run. The dry-run output should
clearly show which dependencies are explicit vs. implicit.

**Why this priority**: Transparency into the scheduling decisions helps users debug ordering
issues and build confidence in the tool's behavior.

**Independent Test**: Can be tested by running `nadle build --dry-run` on a monorepo and
verifying the output shows the full expanded task list with dependency annotations.

**Acceptance Scenarios**:

1. **Given** a monorepo with implicit workspace dependencies,
   **When** the user runs `nadle build --dry-run`,
   **Then** the output shows the execution plan with tasks in topological order, and implicit
   dependencies are distinguishable from explicit ones.

2. **Given** a monorepo where workspace expansion adds child workspace tasks,
   **When** the user runs `nadle build --dry-run`,
   **Then** the output lists all expanded tasks including which workspaces they belong to.

---

### Edge Cases

- What happens when a workspace has circular `package.json` dependencies (A depends on B, B
  depends on A)? Implicit task dependencies would create a cycle — Nadle must detect and report
  this clearly.
- What happens when a workspace dependency references a workspace that has no config file
  (no tasks)? The implicit dependency should be silently ignored.
- What happens when a workspace is excluded via `--exclude`? Its implicit dependencies should
  also be removed from the graph.
- What happens when the user runs a task from a child workspace directory (not root)? Workspace
  task expansion should NOT happen (expansion only occurs for root workspace tasks).
- What happens when `dependsOn` references a task in a workspace that would also receive an
  implicit dependency? The explicit dependency takes precedence, no duplicate edges.
- What happens when a workspace dependency uses a non-`workspace:*` version specifier (e.g.,
  `^1.0.0`)? Only `workspace:*` (and `workspace:~`, `workspace:^`) protocols should create
  implicit dependencies, consistent with current workspace dependency resolution.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST automatically create task dependencies between workspaces when a
  workspace depends on another workspace (via `workspace:*` protocol) and both workspaces
  define a task with the same name. The upstream task must complete before the downstream
  task starts.
- **FR-002**: System MUST allow users to disable implicit workspace task dependencies via
  `configure({ implicitDependencies: false })` in the root config file.
- **FR-003**: System MUST deduplicate dependency edges when both implicit (workspace) and
  explicit (`dependsOn`) dependencies create the same edge in the DAG.
- **FR-004**: System MUST silently skip implicit dependencies when the upstream workspace does
  not define a task with the matching name (no error, the downstream task runs as if the
  dependency doesn't exist).
- **FR-005**: System MUST detect cycles that arise from the combination of implicit workspace
  dependencies and explicit `dependsOn` declarations, and report the full cycle path.
- **FR-006**: System MUST preserve the existing behavior of workspace task expansion — root
  workspace tasks expand to include matching child workspace tasks.
- **FR-012**: When a root workspace task is expanded to include same-name child workspace
  tasks, the root task MUST implicitly depend on all expanded child workspace tasks (Gradle
  aggregation pattern). The root task runs last, after all child workspace tasks with the
  same name complete.
- **FR-007**: System MUST maintain deterministic task ordering — given the same project
  structure and configuration, the execution order must be identical across runs.
- **FR-008**: System MUST index task-by-name lookups for O(1) access instead of the current
  O(n) linear scan across all registered tasks.
- **FR-009**: System MUST show implicit dependencies in `--dry-run` output, distinguishable
  from explicit dependencies.
- **FR-010**: System MUST NOT apply workspace task expansion when Nadle is invoked from a
  child workspace directory (only root invocations trigger expansion).
- **FR-011**: System MUST respect `--exclude` for implicit dependencies — if an upstream
  workspace task is excluded, its implicit dependency edge is removed.
- **FR-013**: System MUST log each injected implicit dependency at `debug` level during
  scheduling (visible only with `--log-level debug`). Default output must remain unaffected.

### Key Entities

- **Implicit Dependency**: A task dependency automatically derived from workspace
  `package.json` dependency relationships. Created when workspace A depends on workspace B
  and both define a task with the same name. Distinguished from explicit dependencies
  (declared via `dependsOn`).
- **Workspace Dependency Graph**: The graph of inter-workspace dependencies derived from
  `package.json` fields (`dependencies`, `devDependencies`, `peerDependencies`,
  `optionalDependencies`) using `workspace:*` protocol references. Already exists in the
  project model but currently informational only.

## Documentation Impact

- **Docs pages to update**: `docs/concepts/workspaces.md` (add section on implicit task
  dependencies), `docs/config-reference.md` (add `implicitDependencies` option),
  `docs/guides/monorepo-setup.md` (update with implicit dependency behavior)
- **Docs pages to create**: None (the concept fits within existing workspace documentation)
- **Sidebar update needed**: No

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users running `nadle build` in a monorepo with workspace dependencies see
  correct build ordering without any explicit cross-workspace `dependsOn` declarations —
  upstream workspace tasks complete before downstream workspace tasks.
- **SC-002**: Scheduling for a monorepo with 100 workspaces and 500 tasks completes in under
  100 milliseconds.
- **SC-003**: All existing tests continue to pass without modification (backward compatibility
  preserved when `implicitDependencies` defaults to `true`).
- **SC-004**: Cycle detection catches 100% of cycles including those created by implicit
  dependencies, with clear error messages showing the full path.
- **SC-005**: Users can opt out of implicit dependencies with a single configuration line,
  restoring current behavior entirely.

## Assumptions

- Workspace dependency relationships in `package.json` are a reliable signal for task ordering.
  This is the same assumption Gradle makes with project dependencies.
- The `workspace:*` protocol (including `workspace:~` and `workspace:^`) is the definitive
  marker for intra-monorepo dependencies. Regular version specifiers (e.g., `^1.0.0`) pointing
  to packages that happen to be in the monorepo do NOT create implicit dependencies.
- Implicit dependencies apply only to same-named tasks across workspaces. If workspace A
  depends on workspace B, then `A:build` depends on `B:build`, `A:test` depends on `B:test`,
  etc. — but `A:build` does NOT depend on `B:test` (that requires explicit `dependsOn`).
- The `implicitDependencies` option defaults to `true` (opt-out, not opt-in) because this
  aligns with Gradle's behavior and meets user expectations for monorepo task runners.
- Performance optimizations (indexed lookups, avoiding redundant transitive closure
  computation) are implementation details that do not change observable behavior.
