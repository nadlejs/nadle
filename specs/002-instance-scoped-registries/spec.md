# Feature Specification: Instance-Scoped Registries

**Feature Branch**: `002-instance-scoped-registries`
**Created**: 2026-02-17
**Status**: Draft
**Input**: GitHub Issue #435 — "Global singleton registries limit testability and composability"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Run Multiple Nadle Instances in One Process (Priority: P1)

As an embedding consumer (library user, IDE plugin, or test harness), I want to create
multiple independent Nadle instances within the same process so that each operates on its own
task set without interfering with the others.

**Why this priority**: This is the core value proposition — without isolation, Nadle cannot be
reliably embedded or used as a library. It also directly unblocks improved worker initialization
(referenced in #428).

**Independent Test**: Can be tested by creating two Nadle instances in the same process, each
loading a different config file with different tasks, and verifying they execute independently
with correct results.

**Acceptance Scenarios**:

1. **Given** two Nadle instances initialized with different config files in the same process,
   **When** both instances register tasks with the same name (e.g., `"build"`),
   **Then** each instance's task registry contains only its own tasks without cross-contamination.
2. **Given** two Nadle instances in the same process,
   **When** both execute their task graphs concurrently,
   **Then** each completes independently with correct results, and neither instance's state
   affects the other.
3. **Given** a Nadle instance that has completed execution,
   **When** a new Nadle instance is created in the same process,
   **Then** the new instance starts with a clean, empty registry — no residual state from the
   previous instance.

---

### User Story 2 - Isolated Test Execution Without Manual Reset (Priority: P2)

As a contributor writing tests for Nadle itself, I want each test to run against a fresh,
isolated Nadle instance so that I do not need to manually reset global state between test cases.

**Why this priority**: This directly improves developer experience and test reliability. Flaky
tests caused by leaked global state are a recurring pain point.

**Independent Test**: Can be tested by running a test suite where each test creates its own
Nadle instance, registers tasks, and asserts state — with no `beforeEach` cleanup required.

**Acceptance Scenarios**:

1. **Given** a test that creates a Nadle instance and registers tasks,
   **When** the test completes and the next test creates a new Nadle instance,
   **Then** the new instance has an empty registry with no tasks from the previous test.
2. **Given** multiple tests running in parallel (e.g., vitest thread pool),
   **When** each test creates its own Nadle instance,
   **Then** no test observes tasks or configuration from another test.

---

### User Story 3 - Reduced Worker Startup Overhead (Priority: P3)

As a user running tasks in parallel mode, I want worker threads to receive the task registry
directly from the parent instance rather than re-loading and re-parsing configuration files,
so that parallel execution starts faster.

**Why this priority**: Eliminating redundant config loading in workers improves performance,
especially in large monorepos with many workspaces. Delivered together with instance-scoped
registries to avoid a temporary hybrid state where registries are instance-scoped but workers
still re-load configs.

**Independent Test**: Can be tested by measuring worker startup time before and after the
change, verifying that workers no longer re-load config files.

**Acceptance Scenarios**:

1. **Given** a project with tasks configured in `nadle.config.ts`,
   **When** a task is dispatched to a worker thread,
   **Then** the worker uses the already-resolved task and configuration data from the parent
   instance without re-loading or re-parsing the config file.
2. **Given** a monorepo with 10+ workspaces,
   **When** tasks are executed in parallel mode,
   **Then** worker startup does not scale linearly with the number of workspace config files.

---

### Edge Cases

- What happens when a Nadle instance is created but never initialized (no `init()` call)?
  The registry should remain empty and usable without errors.
- What happens when config loading fails midway through workspace discovery?
  The partially loaded registry should not leak into other instances.
- What happens when a worker thread outlives the parent Nadle instance?
  The worker should retain its own copy of the data it needs and not reference destroyed state.
- What happens when `configure()` is called multiple times on the same instance?
  Behavior should match current semantics (last call wins for file options, single finalization
  for task registry).
- What happens when `tasks.register()` is called outside of config file loading (no active
  Nadle instance)? An error is thrown indicating that tasks must be registered during config
  loading.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Each Nadle instance MUST own its own task registry, isolated from all other
  instances in the same process.
- **FR-002**: Each Nadle instance MUST own its own file option registry, isolated from all
  other instances.
- **FR-003**: Creating a new Nadle instance MUST NOT require any cleanup or reset of
  previously existing instances or global state.
- **FR-004**: Worker threads MUST receive task and configuration data from their parent Nadle
  instance rather than accessing shared global state.
- **FR-005**: The public API surface (`tasks.register()`, `configure()`, `defineTask()`) MUST
  remain unchanged — existing `nadle.config.ts` files MUST work without modification.
- **FR-006**: The two-phase registration model (buffering during config loading, finalization
  after project resolution) MUST be preserved within each instance's lifecycle.
- **FR-007**: Task name uniqueness MUST continue to be enforced within a workspace scope,
  per instance.
- **FR-008**: The `tasks` object used in config files MUST be bound to the Nadle instance
  that is loading that config file.
- **FR-009**: Calling `tasks.register()`, `configure()`, or other registration APIs outside
  of an active config loading context MUST throw a descriptive error.

### Key Entities

- **Nadle Instance**: The top-level orchestrator that owns all registries, scheduler, and
  execution state for a single run.
- **Task Registry**: Stores registered tasks, scoped to a single Nadle instance. Supports
  buffered registration during config loading and finalization after project resolution.
- **File Option Registry**: Stores file-level options set via `configure()`, scoped to a
  single Nadle instance.
- **Worker Context**: The data passed from a parent Nadle instance to a worker thread,
  containing the resolved task and configuration needed for execution.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Two Nadle instances created in the same process with overlapping task names
  produce correct, independent results 100% of the time.
- **SC-002**: Test suite passes without any `beforeEach`/`afterEach` global state cleanup
  for registry reset.
- **SC-003**: All existing integration and unit tests pass without modification to test
  assertions (fixture/config changes are acceptable if the public API is unchanged).
- **SC-004**: Worker threads load configuration files at most once per thread
  lifetime, not on every task dispatch.
- **SC-005**: No regression in bundle size beyond the existing 140 KB limit.

## Clarifications

### Session 2026-02-17

- Q: Should eliminating worker config re-loading (US3) be delivered in this feature or deferred? → A: Include — deliver registry refactor and worker data transfer together in one feature.
- Q: What should `tasks.register()` do when called outside config loading (no active Nadle instance)? → A: Throw an error ("No active Nadle instance — tasks must be registered during config loading").

## Assumptions

- The `tasks` DSL object in config files can be implicitly bound to the loading instance
  without changing the config file authoring experience.
- Worker threads can receive serialized or transferred registry data rather than
  re-constructing it from config files.
- The existing two-phase registration model (buffer → finalize) is preserved and simply
  scoped to instances rather than global state.
- This change is internal — no breaking changes to the public API or config file format.
