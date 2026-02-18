# Tasks: Instance-Scoped Registries

**Input**: Design documents from `/specs/002-instance-scoped-registries/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story. US1 and US2 share the same
implementation (instance-scoped registries); US2 is validated by running the
existing test suite. US3 (worker optimization) is a separate layer on top.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (AsyncLocalStorage Context Binding)

**Purpose**: Create the context-binding infrastructure that all subsequent changes depend on

- [x] T001 Create AsyncLocalStorage context module in packages/nadle/src/core/nadle-context.ts — export `runWithInstance(instance, fn)` that runs `fn` within an `AsyncLocalStorage<Nadle>` store, and `getCurrentInstance()` that returns the active instance or throws "No active Nadle instance — tasks must be registered during config loading" (FR-009)
- [x] T002 [P] Update ProjectContext interface in packages/nadle/src/core/context.ts — add `readonly fileOptionRegistry: FileOptionRegistry` to the `ProjectContext` interface so handlers and resolvers can access it through context

**Checkpoint**: Foundation ready — `nadle-context.ts` exists, `context.ts` updated

---

## Phase 2: User Story 1+2 — Instance-Scoped Registries (Priority: P1+P2) MVP

**Goal**: Each Nadle instance owns its own TaskRegistry and FileOptionRegistry. No
global singletons. The `tasks` and `configure` DSL exports delegate to the active
instance via AsyncLocalStorage.

**Independent Test**: Build the project (`pnpm -F nadle build:tsup`) and run all
existing tests (`pnpm -F nadle test`). All must pass without modification (SC-003).

### Implementation for User Story 1+2

- [x] T003 [P] [US1] Remove singleton export from packages/nadle/src/core/registration/task-registry.ts — delete `export const taskRegistry = new TaskRegistry();` (line 99). The `TaskRegistry` class remains exported as-is.
- [x] T004 [P] [US1] Update packages/nadle/src/core/registration/file-option-registry.ts — export the `FileOptionRegistry` class (currently not exported, only the singleton instance is). Remove `export const fileOptionRegistry = new FileOptionRegistry();` (line 34).
- [x] T005 [US1] Update packages/nadle/src/core/registration/api.ts — replace the direct `taskRegistry` import with `getCurrentInstance()` from `nadle-context.ts`. The `tasks.register()` method calls `getCurrentInstance().taskRegistry` to access the active instance's registry. Keep all type signatures unchanged. (depends on T001, T003)
- [x] T006 [US1] Update packages/nadle/src/core/options/configure.ts — replace the direct `fileOptionRegistry` import with `getCurrentInstance()` from `nadle-context.ts`. The `configure()` function calls `getCurrentInstance().fileOptionRegistry.register(options)`. (depends on T001, T004)
- [x] T007 [US1] Update packages/nadle/src/core/options/options-resolver.ts — remove the global `fileOptionRegistry` import (line 14). Accept `FileOptionRegistry` as a constructor parameter alongside the existing `TaskRegistry` param. Update all `this.fileOptionRegistry` references accordingly. (depends on T004)
- [x] T008 [US1] Update packages/nadle/src/core/nadle.ts — replace `public readonly taskRegistry = taskRegistry` (line 21, global reference) with `public readonly taskRegistry = new TaskRegistry()`. Add `public readonly fileOptionRegistry = new FileOptionRegistry()`. Remove the `taskRegistry` singleton import (line 8). Pass both registries to `OptionsResolver` constructor. Wrap the `init()` method's config loading call in `runWithInstance(this, async () => { ... })` so that config files see this instance via AsyncLocalStorage. (depends on T001, T003, T004, T007)
- [x] T009 [US1] Build and verify — run `pnpm -F nadle build:tsup` then `pnpm -F nadle test` to confirm all existing integration and unit tests pass without modification (SC-003). Also run `npx tsc -p packages/nadle/tsconfig.build.json --noEmit` for type checking.

**Checkpoint**: US1+US2 complete. Each Nadle instance is fully isolated. Existing tests pass.

---

## Phase 3: User Story 3 — Worker Thread Optimization (Priority: P3)

**Goal**: Worker threads cache their Nadle instance per thread. Config files are
loaded at most once per worker thread lifetime, not on every task dispatch (SC-004).

**Independent Test**: Run a project with parallel tasks. Verify that the second task
dispatched to the same worker thread does not re-load config files (observable via
debug logging).

### Implementation for User Story 3

- [x] T010 [US3] Update packages/nadle/src/core/engine/worker.ts — add a module-level `let workerNadle: Nadle | null = null` cache. In the default export function, check if `workerNadle` is already initialized; if so, reuse it instead of calling `new Nadle().init()`. If not, create and cache it. Replace the `taskRegistry` singleton import (line 11) with `workerNadle.taskRegistry` access. The worker's Nadle instance owns its own registries populated during the one-time config loading. Also fixed pre-existing race condition in packages/nadle/src/core/engine/task-pool.ts (await MessagePort message before state transitions) and made packages/nadle/src/core/models/execution-tracker.ts graceful when a task fails before its start event is processed. (depends on T008)
- [x] T011 [US3] Build and run parallel tests — all 326 tests pass, 0 failures. (depends on T010)

**Checkpoint**: US3 complete. Workers load configs once per thread.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Update project specifications and run final validation

- [x] T012 [P] Update spec/01-task.md — change line 8 from "which is a singleton available from the public API" to describe instance-bound behavior (tasks API delegates to the active Nadle instance during config loading)
- [x] T013 [P] Update spec/04-execution.md — update step 1 of Worker Execution Flow (line 50) to describe per-thread caching: worker initializes Nadle on first dispatch and reuses it for subsequent dispatches
- [x] T014 [P] Update spec/08-configuration-loading.md — add a note in the Loading Flow section that config files are loaded within an AsyncLocalStorage context bound to the active Nadle instance, enabling `tasks.register()` and `configure()` to route to the correct instance
- [x] T015 Update spec/CHANGELOG.md with an entry for this change, and bump spec/README.md version to 1.1.0 (depends on T012, T013, T014)
- [x] T016 Final validation — refactored worker.ts (extracted `getOrCreateNadle`, `createCacheValidator`, `dispatchByValidationResult`, `executeTask` helpers). ESLint clean. Type check clean. All 326 tests pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately
- **US1+US2 (Phase 2)**: Depends on Phase 1 completion — BLOCKS user stories
- **US3 (Phase 3)**: Depends on Phase 2 completion (needs instance-scoped registries)
- **Polish (Phase 4)**: Depends on Phase 3 completion

### Task Dependencies

```
T001 ──┬──→ T005 ──┐
       │           │
       ├──→ T006   ├──→ T008 ──→ T009 ──→ T010 ──→ T011
       │           │
T002   ├──→ T007 ──┘
       │
T003 ──┘
T004 ──┴──→ T006
       └──→ T007

T012 ──┐
T013 ──┼──→ T015 ──→ T016
T014 ──┘
```

### Parallel Opportunities

Within Phase 1:

- T001 and T002 can run in parallel (different files)

Within Phase 2:

- T003 and T004 can run in parallel (different files)
- T005 and T006 can run in parallel (different files, both depend on T001)

Within Phase 4:

- T012, T013, T014 can run in parallel (different spec files)

---

## Implementation Strategy

### MVP First (US1+US2 Only)

1. Complete Phase 1: Foundational (T001-T002)
2. Complete Phase 2: US1+US2 (T003-T009)
3. **STOP and VALIDATE**: Build + test, verify instance isolation
4. This is a viable stopping point — core isolation is delivered

### Full Delivery

1. Complete MVP above
2. Add Phase 3: US3 (T010-T011) — worker optimization
3. Complete Phase 4: Polish (T012-T016) — spec updates, final validation
4. Feature complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All 32 test fixture config files (`import { tasks } from "nadle"`) should work
  without modification since the `tasks` export signature is unchanged
- The `index.api.md` should not change — verify with `api-extractor` in T016
- Commit after each phase checkpoint for easy rollback
