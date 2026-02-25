# Tasks: Caching Improvements

**Input**: Design documents from `/specs/001-caching-improvements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Integration tests are included per constitution principle IV (Integration-First Testing).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: New utilities and type extensions shared across all user stories

- [x] T001 [P] Create concurrency limiter utility in packages/nadle/src/core/utilities/concurrency.ts
- [ ] T002 [P] Create atomic write utility in packages/nadle/src/core/utilities/atomic-write.ts
- [ ] T003 Add `maxCacheEntries` field to TaskConfiguration in packages/nadle/src/core/interfaces/task-configuration.ts
- [ ] T004 Add `maxCacheEntries` to NadleFileOptions and defaults in packages/nadle/src/core/options/cli-options.ts and packages/nadle/src/core/options/options-resolver.ts

**Checkpoint**: Shared utilities and type definitions ready. No behavioral changes yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core cache key and fingerprint changes that all user stories depend on

- [ ] T005 Extend CacheKey.Input with `options` and `dependencyFingerprints` fields in packages/nadle/src/core/models/cache/cache-key.ts
- [ ] T006 Extend CacheValidatorContext with `taskOptions`, `dependencyFingerprints`, and `maxCacheEntries` fields in packages/nadle/src/core/caching/cache-validator.ts
- [ ] T007 Thread new CacheValidatorContext fields into CacheKey.compute() call in CacheValidator.validate() in packages/nadle/src/core/caching/cache-validator.ts
- [ ] T008 Refactor FileFingerprints.compute() to resolve all declarations concurrently and deduplicate file paths before hashing in packages/nadle/src/core/models/cache/fingerprint.ts
- [ ] T009 Use atomic write utility for all metadata JSON writes in CacheManager (writeRunMetadata, writeLatestRunMetadata) in packages/nadle/src/core/caching/cache-manager.ts
- [ ] T010 Use concurrency limiter in CacheManager.saveOutputs() and CacheManager.restoreOutputs() in packages/nadle/src/core/caching/cache-manager.ts

**Checkpoint**: Cache key computation expanded, file I/O hardened. Ready for story-specific work.

---

## Phase 3: User Story 1 — Dependent Task Cache Correctness (Priority: P1)

**Goal**: Downstream tasks automatically re-execute when upstream dependency outputs change.

**Independent Test**: Run A→B pipeline, modify A's output, verify B re-executes.

### Implementation for User Story 1

- [ ] T011 [US1] Extend WorkerMessage type with optional `outputsFingerprint` field in packages/nadle/src/core/engine/worker.ts
- [ ] T012 [US1] Post outputsFingerprint from worker after cache-miss save, up-to-date, and from-cache paths in packages/nadle/src/core/engine/worker.ts
- [ ] T013 [US1] Extend WorkerParams with `dependencyFingerprints` field in packages/nadle/src/core/engine/worker.ts
- [ ] T014 [US1] Collect outputsFingerprints in TaskPool from completed workers into a Map<taskId, string> in packages/nadle/src/core/engine/task-pool.ts
- [ ] T015 [US1] Pass collected dependency fingerprints (from direct dependencies) in WorkerParams when dispatching downstream tasks in packages/nadle/src/core/engine/task-pool.ts
- [ ] T016 [US1] Thread dependencyFingerprints from WorkerParams into CacheValidatorContext in createCacheValidator() in packages/nadle/src/core/engine/worker.ts
- [ ] T017 [P] [US1] Create fixture config with two cacheable tasks A→B in packages/nadle/test/**configs**/cache-dependency.ts
- [ ] T018 [US1] Create integration test for dependency fingerprint invalidation in packages/nadle/test/features/caching/dependency-fingerprint.test.ts

**Checkpoint**: Dependency-aware cache invalidation works end-to-end. False cache hits eliminated.

---

## Phase 4: User Story 2 — Task Options in Cache Key (Priority: P1)

**Goal**: Cache invalidates when task options change.

**Independent Test**: Run task with options, change options, verify cache miss.

### Implementation for User Story 2

- [ ] T019 [US2] Pass resolved task options into CacheValidatorContext in worker.ts dispatch in packages/nadle/src/core/engine/worker.ts
- [ ] T020 [P] [US2] Create fixture config with a task using optionsResolver in packages/nadle/test/**configs**/cache-options.ts
- [ ] T021 [US2] Create integration test for options-based cache invalidation in packages/nadle/test/features/caching/options-in-cache.test.ts

**Checkpoint**: Task options changes correctly invalidate cache.

---

## Phase 5: User Story 3 — Cache Eviction Strategy (Priority: P2)

**Goal**: Cache automatically evicts old entries per task, keeping disk usage bounded.

**Independent Test**: Run task with many different inputs, verify old cache entries are removed.

### Implementation for User Story 3

- [ ] T022 [US3] Implement CacheManager.evict(taskId, maxCacheEntries) method that lists runs, sorts by timestamp, deletes oldest beyond limit in packages/nadle/src/core/caching/cache-manager.ts
- [ ] T023 [US3] Call evict() from CacheValidator.update() after cache-miss save, using resolved maxCacheEntries in packages/nadle/src/core/caching/cache-validator.ts
- [ ] T024 [US3] Create integration test for eviction behavior (accumulate entries, verify cleanup) in packages/nadle/test/features/caching/eviction.test.ts

**Checkpoint**: Cache entries bounded per task. Old entries automatically cleaned up.

---

## Phase 6: User Story 4 — Cache Corruption Recovery (Priority: P2)

**Goal**: Corrupted cache metadata causes graceful fallback, not crashes.

**Independent Test**: Corrupt metadata files, verify tasks re-execute with warning.

### Implementation for User Story 4

- [ ] T025 [US4] Wrap JSON.parse calls in CacheManager.readRunMetadata() and readLatestRunMetadata() with try-catch for SyntaxError, returning null and logging warning in packages/nadle/src/core/caching/cache-manager.ts
- [ ] T026 [US4] Wrap CacheManager.restoreOutputs() in try-catch in worker.ts dispatch, falling back to re-execution on any error in packages/nadle/src/core/engine/worker.ts
- [ ] T027 [US4] Create integration test for corruption recovery (invalid JSON, missing run dir, partial outputs) in packages/nadle/test/features/caching/corruption-recovery.test.ts

**Checkpoint**: Cache corruption never crashes builds. Graceful fallback with warnings.

---

## Phase 7: User Story 5 — File I/O Concurrency Limits (Priority: P3)

**Goal**: Cache save/restore doesn't hit EMFILE errors for large output sets.

**Independent Test**: Already covered by T001 (concurrency utility) and T010 (integration into CacheManager). No additional tasks needed beyond Phase 1 and Phase 2 foundational work.

_No additional tasks — US5 is fully addressed by T001 and T010._

---

## Phase 8: User Story 6 — Input Fingerprinting Performance (Priority: P3)

**Goal**: Input fingerprinting resolves declarations concurrently and deduplicates.

**Independent Test**: Already covered by T008 (fingerprint refactoring in Phase 2). No additional tasks needed.

_No additional tasks — US6 is fully addressed by T008._

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Spec, docs, and final validation

- [ ] T028 [P] Update spec/05-caching.md with new cache key fields, eviction section, corruption recovery, concurrency limits
- [ ] T029 [P] Add changelog entry to spec/CHANGELOG.md and bump version in spec/README.md
- [ ] T030 [P] Update packages/docs/docs/getting-started/features.md with improved caching description
- [ ] T031 [P] Update packages/docs/docs/config-reference.md with maxCacheEntries option
- [ ] T032 Build and run full test suite to verify no regressions: `npx nadle build && pnpm -F nadle test`
- [ ] T033 Update snapshots if needed: `pnpm -F nadle test -- -u`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (uses new utilities and types)
- **Phase 3 (US1)**: Depends on Phase 2 (uses extended CacheKey and CacheValidatorContext)
- **Phase 4 (US2)**: Depends on Phase 2 only — can run in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 2 only — can run in parallel with Phase 3/4
- **Phase 6 (US4)**: Depends on Phase 2 only — can run in parallel with Phase 3/4/5
- **Phase 7 (US5)**: Fully addressed in Phase 1 + 2
- **Phase 8 (US6)**: Fully addressed in Phase 2
- **Phase 9 (Polish)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 (P1)**: Touches worker.ts + task-pool.ts (engine layer). Can start after Phase 2.
- **US2 (P1)**: Touches worker.ts (overlaps with US1 on the same file). Best done after US1 or carefully merged.
- **US3 (P2)**: Touches cache-manager.ts + cache-validator.ts. Independent of US1/US2.
- **US4 (P2)**: Touches cache-manager.ts (overlaps with US3) + worker.ts. Best done after US3.
- **US5 (P3)**: Already done in Phase 1+2.
- **US6 (P3)**: Already done in Phase 2.

### Recommended Execution Order

```
Phase 1 → Phase 2 → US1 (Phase 3) → US2 (Phase 4) → US3 (Phase 5) → US4 (Phase 6) → Polish (Phase 9)
```

US1 and US2 both touch worker.ts so sequential is safer. US3 and US4 both touch cache-manager.ts so sequential is safer. US5 and US6 are covered by foundational work.

### Within Each User Story

- Fixture configs can be created in parallel with implementation
- Implementation tasks are sequential (they build on each other)
- Integration tests come last (need implementation to be complete)

---

## Parallel Opportunities

```text
Phase 1: T001 || T002 (different files)
Phase 1: T003 and T004 are sequential (T004 depends on T003's type change)

Phase 2: T005 and T008 can run in parallel (different files: cache-key.ts vs fingerprint.ts)
Phase 2: T009 || T010 can run in parallel (different CacheManager methods)
Phase 2: T006 and T007 are sequential (T007 uses T006's type changes)

Phase 3: T017 (fixture config) || T011-T016 (implementation)

Phase 9: T028 || T029 || T030 || T031 (all different files)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T010)
3. Complete Phase 3: US1 — Dependency Fingerprints (T011-T018)
4. **STOP and VALIDATE**: Test dependency invalidation end-to-end
5. This alone fixes the most critical correctness gap (#248)

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 (dependency fingerprints) → Most critical correctness fix (#248)
3. US2 (task options) → Second correctness fix (#246)
4. US3 (eviction) → Disk management (#442)
5. US4 (corruption recovery) → Robustness improvement
6. Polish → Spec + docs alignment

---

## Notes

- US5 and US6 have no dedicated tasks because they're fully addressed by foundational work (T001, T008, T010)
- worker.ts is touched by US1, US2, and US4 — coordinate changes carefully
- cache-manager.ts is touched by US3 and US4 — coordinate changes carefully
- All integration tests follow existing patterns: spawn CLI via `withGeneratedFixture`, assert with custom matchers
- Commit after each checkpoint to keep changes atomic
