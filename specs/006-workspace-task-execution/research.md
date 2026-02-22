# Research: Workspace Task Execution Improvements

**Feature**: 006-workspace-task-execution
**Date**: 2026-02-22

## R1: Gradle's Implicit Project-to-Task Dependency Model

**Decision**: Adopt Gradle's pattern — workspace `package.json` dependencies automatically
create same-name task dependencies.

**Rationale**: Gradle's `evaluationDependsOn` and automatic task dependency propagation via
project dependencies is the de facto standard for build tools in monorepos. Turborepo also
does this via `topologicalDependencies` in `turbo.json`. Nx uses `dependsOn` with
`"^build"` syntax. All major build orchestrators derive task ordering from project
dependency graphs. Nadle storing workspace dependencies as "informational only" is the
outlier.

**Alternatives considered**:

- Manual `dependsOn` only (current behavior): Tedious, error-prone, diverges from ecosystem norms.
- Explicit `"^taskName"` syntax like Nx: More expressive but adds DSL complexity. Could be
  a future enhancement on top of implicit deps.
- Turborepo-style `topologicalDependencies` config: Requires per-task configuration. Implicit
  deps are zero-config.

## R2: Dependency Injection Pattern for TaskScheduler

**Decision**: Use a narrow `SchedulerDependencies` interface rather than full DI framework.

**Rationale**: Adding a DI container (tsyringe, inversify) would violate Constitution III
(Lightweight and Focused) and add bundle size. TypeScript's structural typing makes narrow
interfaces a natural DI mechanism — the `Nadle` class already satisfies the interface
structurally. Test code constructs plain objects implementing the same interface.

**Alternatives considered**:

- Full DI container (inversify/tsyringe): Too heavy, violates bundle size constraint.
- Factory functions: Workable but less discoverable than an interface contract.
- Keep current `ProjectContext` with better test helpers: Doesn't solve the coupling problem;
  just makes mocking less painful. User explicitly requested DI isolation.

## R3: Cycle Detection Correctness with Implicit Dependencies

**Decision**: No algorithm change needed. Current DFS with path tracking correctly detects
cycles regardless of how edges are added (explicit or implicit).

**Rationale**: Cycle detection runs after `analyze()` completes — by that point, all edges
(explicit + implicit) are in the dependency graph. The DFS traversal is agnostic to edge
origin. The only requirement is that implicit edges are added during `analyze()` before
cycle detection runs, which is guaranteed by the current `init()` flow:
`expandWorkspaceTasks()` → `analyze()` (adds all edges) → `detectCycle()`.

**Alternatives considered**:

- Separate cycle detection for implicit edges: Unnecessary — a cycle is a cycle regardless of
  edge origin. Would add complexity with no benefit.
- Tarjan's SCC algorithm: More efficient for finding all cycles at once, but current DFS is
  O(V+E) which is sufficient for <1000 tasks. Would add code complexity for no practical gain.

## R4: Task-by-Name Index Performance

**Decision**: Add a `Map<string, RegisteredTask[]>` index built during `TaskRegistry.configure()`.

**Rationale**: Current `getTaskByName()` does `this.tasks.filter(({ name }) => name === taskName)`,
which is O(n) per call. With implicit dependency resolution, this gets called for every task
during `analyze()` (once per workspace dependency). For 500 tasks with average 3 workspace
deps each, that's ~1500 linear scans. A Map index makes each lookup O(1). The index is
built once during `configure()` and never mutated afterward.

**Alternatives considered**:

- No change (keep linear scan): Works for small monorepos but user explicitly requested perf
  optimization, and the index is trivial to add.
- Bloom filter or similar: Overkill for this data size. A Map is simpler and exact.

## R5: Root Task Aggregation Strategy

**Decision**: Root task gains implicit dependencies on all expanded same-name child workspace
tasks during `expandWorkspaceTasks()`.

**Rationale**: This matches Gradle's aggregation pattern where root `build` depends on all
subproject `build` tasks. Implementation-wise, the dependency edges are recorded during
expansion and injected into `analyze()` alongside workspace-derived implicit deps. This
ensures root `build` runs last, after all child `build` tasks complete. The edges use the
same deduplication and exclusion logic as other implicit deps.

**Alternatives considered**:

- Root task runs first (inverse): Contradicts Gradle convention and user expectation.
- Root task runs independently (no relationship): Current behavior — leads to non-deterministic
  ordering between root and child tasks.

## R6: Spec File Updates Required

**Decision**: Update `spec/03-scheduling.md` and `spec/07-workspace.md` to document implicit
dependencies, root task aggregation, and the `implicitDependencies` option. Bump spec version
from 1.4.0 to 1.5.0 (minor — new concepts/sections).

**Rationale**: Per CLAUDE.md instructions, `spec/` is the single source of truth. New
behavioral contracts (implicit deps, root aggregation) must be documented there. The changes
are additive (new sections, expanded existing sections), warranting a minor version bump.
