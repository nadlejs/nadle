# Feature Specification: Skip Redundant Worker Re-Initialization

**Feature Branch**: `003-skip-worker-reinit`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "fix #428 based on this branch"
**Related Issue**: [#428 — Eliminate redundant Nadle re-initialization in worker threads](https://github.com/nadlejs/nadle/issues/428)
**Builds On**: `002-instance-scoped-registries` (instance-scoped registries with per-thread Nadle caching)

## Context

With instance-scoped registries (branch 002), each worker thread creates and caches a Nadle
instance on first task dispatch. That instance is reused for subsequent dispatches within the
same thread, so config files are loaded at most once per worker thread lifetime.

However, the first initialization per worker still performs the full option resolution
pipeline: filesystem walks for workspace discovery, option merging, worker count resolution,
and task input resolution. All of this work was already completed by the main thread and is
redundant — the worker only needs to load config files (to populate task function closures)
and populate the task registry.

## User Scenarios & Testing

### User Story 1 — Faster Worker Startup (Priority: P1)

As a developer using parallel task execution, I want worker threads to start executing tasks
faster by skipping redundant initialization work that the main thread already completed.

**Why this priority**: This is the core value proposition. Every parallel task execution pays
the cost of redundant project resolution and option merging in each worker thread. For projects
with many workspaces, the filesystem walk overhead is especially significant.

**Independent Test**: Run a project with parallel tasks. Compare per-worker startup time before
and after the change. Workers should reach task execution faster.

**Acceptance Scenarios**:

1. **Given** a project with parallel tasks, **When** tasks are dispatched to worker threads,
   **Then** workers do not re-resolve the project structure (no redundant filesystem walks).
2. **Given** fully resolved options from the main thread, **When** a worker initializes,
   **Then** the worker reuses those resolved options without re-merging defaults, file options,
   and CLI flags.
3. **Given** a multi-workspace project, **When** a worker thread starts, **Then** config files
   are still loaded (to populate task function closures and the task registry), but workspace
   discovery and dependency resolution are skipped.

---

### User Story 2 — Behavioral Parity (Priority: P1)

As a developer, I expect the optimization to be transparent — all tasks must produce the same
results regardless of whether they run in the main thread's Nadle instance or a worker's
lightweight instance.

**Why this priority**: Correctness is non-negotiable. This is a performance optimization that
must not change observable behavior.

**Independent Test**: Run the full existing test suite. All tests must pass without modification.

**Acceptance Scenarios**:

1. **Given** the complete existing test suite (326+ tests), **When** all tests run after the
   change, **Then** all tests pass without modification.
2. **Given** a task with cache validation, **When** it runs in a worker, **Then** cache
   fingerprinting and validation produce identical results to the previous implementation.
3. **Given** a task with custom environment variables, **When** it runs in a worker, **Then**
   environment injection and restoration behave identically.

---

### User Story 3 — Observable Improvement (Priority: P2)

As a contributor or user curious about performance, I want to verify through debug logging
that workers are actually skipping redundant work.

**Why this priority**: Observability helps validate the optimization and diagnose future issues,
but it is not a correctness requirement.

**Independent Test**: Run with `--log-level debug` and verify log output shows that workers
skip project resolution.

**Acceptance Scenarios**:

1. **Given** debug logging enabled, **When** a worker initializes its Nadle instance, **Then**
   log output confirms config files are loaded but project resolution is skipped.

---

### Edge Cases

- What happens when the main thread's resolved options reference paths that are relative to
  the project root? Workers must resolve these paths consistently.
- What happens if a config file has side effects beyond task registration (e.g., modifying
  global state)? Config files are still loaded per worker, so side effects still occur once
  per worker thread.
- What happens in sequential (non-parallel) mode? Sequential tasks run in the main thread,
  so this optimization does not apply. Behavior must be unchanged.

## Requirements

### Functional Requirements

- **FR-001**: Workers MUST reuse the fully resolved options passed from the main thread
  instead of re-running the option resolution pipeline.
- **FR-002**: Workers MUST skip project structure resolution (workspace discovery, dependency
  resolution, filesystem walks) since the resolved project is already available in the
  passed options.
- **FR-003**: Workers MUST still load config files to populate task function closures and
  the task registry, since function references cannot be serialized across threads.
- **FR-004**: Workers MUST still be able to look up any task by ID, resolve its configuration,
  and execute its function after the lightweight initialization.
- **FR-005**: Cache validation in workers MUST produce identical results — the same config
  files, working directory, and project directory must be used for fingerprinting.
- **FR-006**: The per-thread Nadle caching (from branch 002) MUST be preserved — config files
  are loaded at most once per worker thread lifetime, not on every task dispatch.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All existing tests (326+) pass without modification after the change.
- **SC-002**: Worker first-dispatch initialization skips project resolution and option
  merging — measurable as fewer filesystem operations per worker startup.
- **SC-003**: No new dependencies or public API changes are introduced (the optimization
  is purely internal).
- **SC-004**: Bundle size remains within the existing 140 KB limit.

## Assumptions

- Config files must still be loaded in each worker thread because task runner functions are
  closures defined in those config files and cannot be serialized across thread boundaries.
- The resolved options (including the nested project structure) are already serializable via
  the structured clone algorithm used by worker threads, since they consist of plain objects,
  strings, numbers, and arrays.
- The existing per-thread Nadle caching from branch 002 provides the foundation — this feature
  narrows the scope of what happens during that one-time per-thread initialization.
