# Feature Specification: Caching Improvements

**Feature Branch**: `001-caching-improvements`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "Resolve all caching issues, architecture and API improvements, performance optimizations, and potential rewrite of caching internals"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Dependent Task Cache Correctness (Priority: P1)

As a developer with a multi-task build pipeline (e.g., `compile` depends on `codegen`), I need the
cache to automatically invalidate downstream tasks when upstream task outputs change, so I never get
stale build artifacts from false cache hits.

**Why this priority**: Without this, users can silently get incorrect cached results when a
dependency re-executes with different outputs. This is the most critical correctness gap in the
current caching system (GitHub issue #248).

**Independent Test**: Can be tested by running a two-task pipeline, modifying the upstream task's
output, and verifying the downstream task re-executes instead of returning a false cache hit.

**Acceptance Scenarios**:

1. **Given** task B depends on task A and both have caching configured, **When** task A re-executes
   and produces different outputs, **Then** task B's cache is invalidated and B re-executes.
2. **Given** task B depends on task A, **When** task A is up-to-date (no change), **Then** task B's
   cache remains valid and B is also up-to-date.
3. **Given** a chain of three tasks A -> B -> C, **When** A's inputs change, **Then** all
   downstream tasks (B and C) are invalidated transitively.
4. **Given** task B depends on task A but A has no caching configured (no inputs/outputs),
   **Then** B's cache behavior is unaffected by A (backward-compatible).

---

### User Story 2 - Task Options in Cache Key (Priority: P1)

As a developer using built-in tasks (ExecTask, PnpmTask, etc.) with runtime options, I need
the cache to invalidate when task options change, so I don't get cached results from a previous
configuration.

**Why this priority**: Built-in tasks accept options (e.g., command strings, arguments) that
directly affect outputs. Changing options without cache invalidation produces incorrect results
(GitHub issue #246).

**Independent Test**: Can be tested by running a task with options, changing the options, and
verifying the task re-executes instead of returning a stale cache hit.

**Acceptance Scenarios**:

1. **Given** a task with `options: { command: "build --dev" }` has a cached result, **When** the
   options change to `{ command: "build --prod" }`, **Then** the cache misses and the task
   re-executes.
2. **Given** a task with options that remain unchanged, **When** re-run, **Then** the cache hit
   behavior is preserved (up-to-date or restore-from-cache).
3. **Given** a task with no options configured, **Then** the cache key computation is
   backward-compatible and existing cache entries remain valid.

---

### User Story 3 - Cache Eviction Strategy (Priority: P2)

As a developer working on a long-lived project, I need the cache to automatically manage its disk
footprint, so the cache directory doesn't grow unbounded and consume excessive disk space.

**Why this priority**: Without eviction, the cache grows indefinitely for tasks with frequently
changing inputs. Users must manually run `--clean-cache` which destroys all cached data, including
valid entries (GitHub issue #442).

**Independent Test**: Can be tested by running tasks with many different inputs to accumulate cache
entries, then verifying that old entries are automatically cleaned up based on the eviction policy.

**Acceptance Scenarios**:

1. **Given** a task has accumulated more cache entries than the maximum allowed per task, **When**
   a new cache entry is saved, **Then** the oldest entries beyond the limit are automatically
   removed.
2. **Given** a task has cache entries, **When** the total cache size exceeds the configured
   maximum, **Then** the least recently used entries across all tasks are evicted.
3. **Given** a freshly created cache with entries within limits, **Then** no eviction occurs.
4. **Given** eviction is triggered, **Then** only stale entries are removed; the latest entry
   for each task is always preserved.

---

### User Story 4 - Cache Corruption Recovery (Priority: P2)

As a developer, when cache metadata becomes corrupted (partial writes, invalid JSON, missing
files), I need the system to gracefully recover instead of crashing, so my build doesn't fail
due to cache infrastructure issues.

**Why this priority**: Corrupted metadata can cause unhandled JSON parse errors or misleading
error messages. Graceful recovery improves reliability, especially in CI environments where
cache directories may be shared or interrupted.

**Independent Test**: Can be tested by deliberately corrupting cache metadata files and verifying
the task re-executes with a clean cache miss instead of crashing.

**Acceptance Scenarios**:

1. **Given** a task's run metadata contains invalid JSON, **When** cache validation runs,
   **Then** the system treats it as a cache miss and re-executes the task.
2. **Given** a task's latest pointer references a non-existent run, **When** cache validation
   runs, **Then** the system treats it as a cache miss.
3. **Given** cached output files are partially missing from the outputs directory, **When**
   restore-from-cache is attempted, **Then** the system falls back to a cache miss and
   re-executes the task.
4. **Given** a cache corruption recovery occurs, **Then** a warning message is logged indicating
   the corruption and recovery action taken.

---

### User Story 5 - File I/O Concurrency Limits (Priority: P3)

As a developer with tasks that produce thousands of output files, I need cache save/restore
operations to respect OS file descriptor limits, so large tasks don't fail with EMFILE errors.

**Why this priority**: The current implementation uses unbounded `Promise.all()` for file copy
operations. While this works for typical workloads, tasks with thousands of outputs can hit OS
file descriptor limits, causing intermittent failures.

**Independent Test**: Can be tested by configuring a task with a large number of output files and
verifying cache save/restore completes without file descriptor exhaustion errors.

**Acceptance Scenarios**:

1. **Given** a task with 5000 output files, **When** saving to cache, **Then** the operation
   completes successfully without EMFILE errors.
2. **Given** a task with 5000 cached output files, **When** restoring from cache, **Then** the
   operation completes successfully without EMFILE errors.
3. **Given** concurrency limits are applied, **Then** cache save/restore performance for typical
   workloads (< 100 files) is not noticeably degraded.

---

### User Story 6 - Input Fingerprinting Performance (Priority: P3)

As a developer with a monorepo containing many input files, I need input fingerprinting to be
as fast as possible, so cache validation doesn't add significant overhead to task execution.

**Why this priority**: For large monorepos with thousands of input files, sequential declaration
resolution followed by parallel hashing may still be slow. Optimizing the fingerprinting pipeline
reduces overhead on every task run.

**Independent Test**: Can be tested by measuring cache validation time for tasks with large
input sets and comparing before/after optimization.

**Acceptance Scenarios**:

1. **Given** a task with 1000 input files across multiple declarations, **When** computing input
   fingerprints, **Then** all declarations are resolved and hashed concurrently rather than
   sequentially per declaration.
2. **Given** input fingerprinting completes, **Then** there are no redundant file reads (each
   file is read and hashed at most once, even if matched by multiple declarations).

---

### Edge Cases

- What happens when a dependent task has caching disabled (`--no-cache`) but the downstream task
  has caching enabled? The downstream task should always re-execute since it cannot verify
  dependency freshness.
- What happens when cache eviction removes an entry that another concurrent task is trying to
  restore? The restore should fail gracefully and fall back to re-execution.
- What happens when the cache directory is on a read-only filesystem? Cache operations should
  fail gracefully without crashing the task execution.
- What happens when two worker threads attempt to write cache metadata for the same task
  simultaneously? Writes should be atomic or serialized to prevent corruption.
- What happens when a task's options resolver returns a non-deterministic value (e.g., includes
  a timestamp)? The cache will miss on every run, which is correct behavior.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The cache key computation MUST include the serialized output fingerprints of all
  direct dependency tasks that have caching enabled, in addition to the current inputs
  (taskId, inputsFingerprints, env).
- **FR-002**: The cache key computation MUST include the serialized task options (from
  `optionsResolver`) when options are configured for a task.
- **FR-003**: The system MUST support a configurable maximum number of cache entries per task
  (default: 5), automatically evicting the oldest entries when the limit is exceeded.
- **FR-004**: The system MUST gracefully handle corrupted cache metadata by treating it as a
  cache miss and logging a warning, rather than throwing an unhandled error.
- **FR-005**: Cache save and restore operations MUST limit concurrent file I/O operations to
  prevent file descriptor exhaustion on large output sets.
- **FR-006**: Input fingerprint computation MUST resolve all declarations concurrently and
  deduplicate files matched by multiple declarations.
- **FR-007**: When a dependent task's cache cannot be verified (no caching configured, caching
  disabled, or cache miss), downstream tasks MUST treat their dependency input as "changed"
  and invalidate accordingly.
- **FR-008**: Cache metadata writes MUST be atomic (write-then-rename) to prevent corruption
  from interrupted writes or concurrent access.
- **FR-009**: The eviction strategy MUST always preserve the latest cache entry for each task,
  even when the per-task limit is 1.

### Key Entities

- **Cache Key**: A 64-character hex SHA-256 hash derived from task ID, input fingerprints,
  environment variables, dependency output fingerprints, and task options hash.
- **Cache Entry**: A run directory containing metadata and output snapshots, identified by
  its cache key.
- **Eviction Policy**: Rules governing automatic cleanup of old cache entries, configured
  per-task or globally.
- **Dependency Fingerprint**: The combined output fingerprint of a task's direct dependencies,
  used as an additional cache key input.

## Documentation Impact

- **Docs pages to update**: `docs/concepts/caching.md` (add dependency inputs, options, eviction),
  `docs/config-reference.md` (add `maxCacheEntries` option), `docs/getting-started/features.md`
  (update caching feature description)
- **Spec pages to update**: `spec/05-caching.md` (cache key fields, eviction, corruption recovery,
  concurrency limits), `spec/CHANGELOG.md` and `spec/README.md` (version bump)
- **Sidebar update needed**: No (updating existing pages only)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Downstream tasks correctly re-execute when upstream dependency outputs change,
  with zero false cache hits in all dependency chain configurations.
- **SC-002**: Changing task options always triggers cache invalidation, verified by test coverage
  across all built-in task types.
- **SC-003**: Cache disk usage stays bounded — after sustained use with varying inputs, the cache
  directory size stabilizes within the configured limits.
- **SC-004**: Cache save/restore operations complete without EMFILE errors for tasks with up to
  10,000 output files.
- **SC-005**: Corrupted cache metadata never causes a task execution failure — the system always
  recovers by falling back to re-execution.
- **SC-006**: Input fingerprinting for 1000 files completes with no redundant file reads (each
  unique file hashed exactly once).

## Assumptions

- The `optionsResolver` function returns a serializable object that can be deterministically
  hashed. Non-deterministic options (e.g., timestamps) will naturally cause cache misses on every
  run, which is acceptable.
- Dependency output fingerprints are available after task scheduling but before downstream cache
  validation. The execution engine provides this information to the cache validator.
- The default per-task cache entry limit of 5 is sufficient for most workflows. Users can
  configure this via `configure()` or task-level configuration.
- Atomic file writes (write-then-rename) are supported on all target platforms (Linux, macOS,
  Windows/NTFS).
- The hashing mechanism used for cache key computation can deterministically serialize
  the expanded cache key inputs (including dependency fingerprints and options).
