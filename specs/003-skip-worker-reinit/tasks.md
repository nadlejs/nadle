# Tasks: Skip Redundant Worker Re-Initialization

**Input**: Design documents from `/specs/003-skip-worker-reinit/`
**Prerequisites**: plan.md, spec.md, research.md

**Organization**: Tasks are grouped by user story. US1 and US2 share the same
implementation (lightweight worker init); US2 is validated by running the existing test
suite. US3 (observability) is a separate layer on top.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1+2 — Lightweight Worker Init + Behavioral Parity (Priority: P1)

**Goal**: Workers skip redundant project resolution and option merging by using a new
`initForWorker(resolvedOptions)` method that directly assigns resolved options and only
loads config files for task function closures. All existing tests pass unchanged.

**Independent Test**: Build the project (`pnpm -F nadle build:tsup`) and run all existing
tests (`pnpm -F nadle test`). All must pass without modification (SC-001).

### Implementation for User Story 1+2

- [x] T001 [US1] Add `initForWorker(resolvedOptions: NadleResolvedOptions)` method to `Nadle` class in packages/nadle/src/core/nadle.ts — this method directly assigns `this.#options = resolvedOptions`, configures the logger from resolved options, then runs within `runWithInstance(this, ...)` to load config files using paths from `resolvedOptions.project` (rootWorkspace.configFilePath and workspaces[*].configFilePath). For each workspace config file, set workspace context via `taskRegistry.onConfigureWorkspace(workspaceId)` and `fileOptionRegistry.onConfigureWorkspace(workspaceId)`, then load the file via `DefaultFileReader.read()`. After all files are loaded, call `taskRegistry.configure(resolvedOptions.project)` to flush the buffer. Return `this`. (FR-001, FR-002, FR-003)
- [x] T002 [US1] Update `getOrCreateNadle()` in packages/nadle/src/core/engine/worker.ts — change from `new Nadle({ ...options, tasks: [], excludedTasks: [] }).init()` to `new Nadle({ ...options, tasks: [], excludedTasks: [] }).initForWorker(options)`. The `Nadle` constructor still takes `NadleCLIOptions` (needed for field declarations), but `initForWorker` bypasses `OptionsResolver` entirely and uses the passed resolved options directly. (FR-001, FR-004, FR-006)
- [x] T003 [US2] Build and verify behavioral parity — run `pnpm -F nadle build:tsup` then `pnpm -F nadle test` to confirm all existing tests pass without modification (SC-001). Also run `npx tsc -p packages/nadle/tsconfig.build.json --noEmit` for type checking.

**Checkpoint**: US1+US2 complete. Workers skip redundant init. All tests pass.

---

## Phase 2: User Story 3 — Observable Improvement (Priority: P2)

**Goal**: Debug logging confirms workers use the lightweight init path.

**Independent Test**: Run a parallel project with `--log-level debug` and verify log output
shows config loading without project resolution.

### Implementation for User Story 3

- [x] T004 [US3] Add a debug log statement in `initForWorker()` in packages/nadle/src/core/nadle.ts — log a message via `this.logger.debug()` indicating the worker is using the lightweight init path (e.g., "Worker init: loading config files (skipping project resolution)"). This is sufficient for verifying the optimized path is active.

**Checkpoint**: US3 complete. Debug logging confirms lightweight init.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Update project specification and run final validation

- [x] T005 [P] Update spec/04-execution.md — expand step 1 of Worker Execution Flow to describe the lightweight initialization: worker receives resolved options from the main thread, loads config files to populate task function closures and the task registry, but skips project resolution, option merging, and task input resolution.
- [x] T006 [P] Update spec/CHANGELOG.md with an entry for this change, and bump spec/README.md version to 1.2.0 (minor — expanded worker initialization rules)
- [x] T007 Final validation — run `npx tsc -p packages/nadle/tsconfig.build.json --noEmit` for type checking, `pnpm -F nadle build:tsup` for build, `pnpm -F nadle test` for all tests. Verify ESLint clean. Verify bundle size within 140 KB limit (SC-004).

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1+US2 (Phase 1)**: No dependencies — can start immediately
- **US3 (Phase 2)**: Depends on Phase 1 (adds logging to the method created in T001)
- **Polish (Phase 3)**: Depends on Phase 2 completion

### Task Dependencies

```
T001 ──→ T002 ──→ T003 ──→ T004 ──→ T005 ──┐
                                    T006 ──┼──→ T007
                                           ┘
```

### Parallel Opportunities

Within Phase 3:
- T005 and T006 can run in parallel (different files)

---

## Implementation Strategy

### MVP First (US1+US2 Only)

1. Complete Phase 1: US1+US2 (T001-T003)
2. **STOP and VALIDATE**: Build + test, verify all 326+ tests pass
3. This is a viable stopping point — core optimization is delivered

### Full Delivery

1. Complete MVP above
2. Add Phase 2: US3 (T004) — debug logging
3. Complete Phase 3: Polish (T005-T007) — spec updates, final validation
4. Feature complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All existing test fixture config files should work without modification since the
  `tasks` and `configure` export signatures are unchanged
- The `index.api.md` should not change — `initForWorker` is not exported in the public API
- Commit after each phase checkpoint for easy rollback
