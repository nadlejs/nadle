# Tasks: Workspace Task Execution Improvements

**Input**: Design documents from `/specs/006-workspace-task-execution/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Included — user explicitly requested heavy unit tests with DI isolation, plus integration tests per Constitution IV (integration-first).

**Organization**: Tasks grouped by user story. User stories can be implemented sequentially in priority order after the foundational phase completes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Source**: `packages/nadle/src/core/`
- **Tests**: `packages/nadle/test/`
- **Spec**: `spec/`

---

## Phase 1: Foundational — Scheduler DI Refactoring

**Purpose**: Extract narrow injectable interfaces from the monolithic `ProjectContext`, enabling pure unit tests for all scheduling logic. This phase MUST complete before any user story work begins — implicit dependencies, root aggregation, and cycle detection all depend on the new `SchedulerDependencies` interface.

- [x] T001 [P] Create `SchedulerDependencies`, `SchedulerTask`, `SchedulerLogger`, `SchedulerOptions` interfaces in `packages/nadle/src/core/engine/scheduler-types.ts` per contracts/scheduler-interfaces.ts. Export from `packages/nadle/src/core/engine/index.ts`. Keep under 60 lines — interfaces only, no implementation.

- [x] T002 [P] Add `implicitDependencies` field to `NadleBaseOptions` (optional boolean) in `packages/nadle/src/core/options/types.ts`. Add to `OptionsResolver.defaultOptions` as `true` in `packages/nadle/src/core/options/options-resolver.ts`. Ensure it flows through to `NadleResolvedOptions`.

- [x] T003 [P] Add `nameIndex` (`Map<string, RegisteredTask[]>`) to `TaskRegistry` in `packages/nadle/src/core/registration/task-registry.ts`. Build the index during `configure()` after populating the registry. Replace `getTaskByName()` implementation to use the index for O(1) lookups. Keep the existing method signature unchanged.

- [x] T004 Refactor `TaskScheduler` constructor in `packages/nadle/src/core/engine/task-scheduler.ts` to accept `SchedulerDependencies` instead of `ProjectContext`. Replace all `this.context.taskRegistry.getTaskById()` calls with `this.deps.getTaskById()`, `this.context.taskRegistry.getTaskByName()` with `this.deps.getTasksByName()`, `this.context.taskRegistry.parse()` with `this.deps.parseTaskRef()`, `this.context.logger` with `this.deps.logger`, `this.context.options.parallel` with `this.deps.options.parallel`. Add `this.deps.isRootWorkspace()` call in `expandWorkspaceTasks()` replacing `RootWorkspace.isRootWorkspaceId()`. Depends on T001.

- [x] T005 Update `Nadle` class in `packages/nadle/src/core/nadle.ts` to satisfy `SchedulerDependencies` structurally. Add adapter methods: `getTaskById()` delegates to `this.taskRegistry.getTaskById()`, `getTasksByName()` delegates to `this.taskRegistry.getTaskByName()`, `parseTaskRef()` delegates to `this.taskRegistry.parse()`, `isRootWorkspace()` delegates to `RootWorkspace.isRootWorkspaceId()`, `getWorkspaceDependencies()` looks up workspace by ID in `this.options.project` and returns its `dependencies` array. Update `TaskScheduler` construction to pass `this` (Nadle already implements the interface structurally). Depends on T001, T004.

- [x] T006 Rewrite `packages/nadle/test/unit/task-scheduler.test.ts` to use the new `SchedulerDependencies` interface instead of mocking `ProjectContext`. Create a `createMockDeps()` helper that returns a plain object satisfying the interface with `vi.fn()` stubs. Port all existing test cases (linear chain, diamond dependency, parallel tasks, sequential mode, cycles, excluded tasks) to the new mock structure. All existing tests must pass. Depends on T004.

- [x] T007 Build and run all existing tests to verify no regressions from the DI refactoring: `pnpm -F nadle build:tsup && pnpm -F nadle test`. Fix any failures. Depends on T002, T003, T004, T005, T006.

**Checkpoint**: Scheduler uses `SchedulerDependencies` interface. All existing tests pass. `implicitDependencies` option exists (default `true`) but is not yet read by the scheduler. `nameIndex` provides O(1) lookups. DI foundation is ready for feature work.

---

## Phase 2: User Story 1 — Implicit Task Dependencies (Priority: P1) MVP

**Goal**: Workspace `package.json` dependencies automatically create same-name task dependencies. Running `nadle build` from root correctly orders workspace builds by dependency graph.

**Independent Test**: Create monorepo where `app` depends on `lib`, both define `build`, run `nadle build`, verify `lib:build` before `app:build`.

### Unit Tests for User Story 1

- [x] T008 [P] [US1] Create `packages/nadle/test/unit/implicit-dependency-resolver.test.ts` with unit tests for the pure resolver function. Test cases: (1) linear chain — workspace B depends on A, both have `build`, returns `{A:build}` for B; (2) diamond — app depends on lib-a and lib-b, both depend on core, returns correct sets; (3) missing upstream task — upstream workspace has no matching task, returns empty set; (4) excluded task — upstream task is in excluded set, skipped; (5) no workspace dependencies — returns empty set; (6) self-referencing workspace dep — should not create self-dependency. Use the `SchedulerDependencies` subset interface for test setup.

- [x] T009 [P] [US1] Add unit tests to `packages/nadle/test/unit/task-scheduler.test.ts` for implicit dependency integration. Test cases: (1) scheduler with `implicitDependencies: true` adds edges from workspace deps; (2) scheduler with `implicitDependencies: false` does NOT add implicit edges; (3) explicit `dependsOn` and implicit dep to same target produce only one edge (deduplication); (4) implicit deps respect `--exclude` filtering. Use `createMockDeps()` with `getWorkspaceDependencies` returning workspace dep arrays.

### Implementation for User Story 1

- [x] T010 [US1] Create `packages/nadle/src/core/engine/implicit-dependency-resolver.ts` — export a `resolveImplicitDependencies` function. Inputs: `taskName: string`, `workspaceId: string`, `excludedTaskIds: ReadonlySet<string>`, `deps` (subset of `SchedulerDependencies`). Logic: call `deps.getWorkspaceDependencies(workspaceId)` to get upstream workspace IDs; for each upstream, call `deps.getTasksByName(taskName)` and find the task in that workspace; if found and not excluded, add to result set; log each addition at debug level via `deps.logger.debug()`. Return `Set<TaskIdentifier>`. Keep function under 30 lines.

- [x] T011 [US1] Integrate implicit dependencies into `TaskScheduler.analyze()` in `packages/nadle/src/core/engine/task-scheduler.ts`. After resolving explicit `dependsOn` into the `dependencies` set, if `this.deps.options.implicitDependencies` is `true`, call `resolveImplicitDependencies(task.name, task.workspaceId, this.excludedTaskIds, this.deps)` and merge the returned set into `dependencies` (Set deduplication handles overlaps with explicit deps). No changes to cycle detection or Kahn's algorithm — they operate on the unified dependency graph. Depends on T010.

- [x] T012 [US1] Wire `configure({ implicitDependencies: false })` opt-out through to the scheduler. In `packages/nadle/src/core/nadle.ts`, the `options` getter on `SchedulerDependencies` must expose `implicitDependencies` from `NadleResolvedOptions`. Verify that `configure({ implicitDependencies: false })` in root config results in the scheduler receiving `false`. Depends on T002, T011.

- [x] T013 [US1] Build and run unit tests: `pnpm -F nadle build:tsup && pnpm -F nadle test unit`. Verify T008 and T009 test cases pass. Fix any failures. Depends on T008, T009, T010, T011, T012.

### Integration Tests for User Story 1

- [x] T014 [US1] Create `packages/nadle/test/features/workspaces/workspaces-implicit-deps.test.ts` with integration tests using `withFixture()` and the `monorepo` fixture. Test cases: (1) **linear chain**: `app` depends on `lib`, both define `build`, verify `toRunInOrder("lib:build", "app:build")`; (2) **diamond**: `app` -> `lib-a`, `lib-b` -> `core`, verify `core:build` before `lib-a:build`/`lib-b:build` before `app:build`; (3) **missing upstream task**: `lib` has no `build` task, `app:build` runs without error; (4) **opt-out**: `configure({ implicitDependencies: false })`, verify no implicit ordering enforced; (5) **deduplication**: explicit `dependsOn` + implicit dep to same target, no errors, correct ordering. Build before running: requires `pnpm -F nadle build:tsup`. Depends on T011.

- [x] T015 [US1] Run full test suite (`pnpm -F nadle test`) to verify no regressions in existing workspace tests (`workspaces-basic-tasks`, `workspaces-depends-on-tasks`, etc.). The default `implicitDependencies: true` may change execution order in existing fixtures — update test expectations if needed (e.g., if existing monorepo fixtures have workspace deps that now create implicit task deps). Depends on T014.

**Checkpoint**: Implicit workspace task dependencies work end-to-end. `nadle build` in a monorepo orders tasks by workspace dependency graph. Opt-out via `configure()` works. All tests pass.

---

## Phase 3: User Story 2 — Root Task Aggregation (Priority: P2)

**Goal**: When root `build` expands to include child workspace `build` tasks, the root task runs last (after all child tasks complete), acting as a Gradle-style aggregation point.

**Independent Test**: Create monorepo with root `build` and child `lib:build` + `app:build`, run `nadle build`, verify root `build` runs after all child builds.

### Unit Tests for User Story 2

- [ ] T016 [P] [US2] Add unit tests to `packages/nadle/test/unit/task-scheduler.test.ts` for root task aggregation. Test cases: (1) root `build` with two child workspace `build` tasks — root `build` has indegree 2, both children have indegree 0; (2) root `build` with explicit `dependsOn: ["check"]` plus aggregation — root `build` depends on `check` AND both child builds; (3) root task aggregation does NOT happen when `implicitDependencies: false`; (4) root task with no child same-name tasks — no aggregation edges added.

### Implementation for User Story 2

- [ ] T017 [US2] Modify `expandWorkspaceTasks()` in `packages/nadle/src/core/engine/task-scheduler.ts` to record root task aggregation dependencies. When a root workspace task expands to include child workspace tasks, store the mapping `rootTaskId -> Set<childTaskIds>` in a new private field `rootAggregationDeps: Map<TaskIdentifier, Set<TaskIdentifier>>`. During `analyze()`, after resolving explicit + implicit deps, if the current task is a root task with entries in `rootAggregationDeps`, merge those child task IDs into the dependencies set. Only apply when `implicitDependencies` is enabled. Depends on T011.

- [ ] T018 [US2] Write integration test in `packages/nadle/test/features/workspaces/workspaces-implicit-deps.test.ts` (append to existing file). Test cases: (1) root `build` runs after all child `build` tasks; (2) root `build` with `dependsOn: ["check"]` runs after both `check` and all child builds; (3) independent workspaces with root task — root runs last, children may run concurrently. Depends on T017.

**Checkpoint**: Root `build` always runs after all child workspace `build` tasks. Existing tests still pass.

---

## Phase 4: User Story 3 — Cycle Detection Robustness (Priority: P2)

**Goal**: Cycle detection correctly catches cycles from implicit workspace dependencies and reports clear error messages with full cycle paths.

**Independent Test**: Create monorepo where workspace A depends on B and B depends on A in `package.json`, both define `build`, verify cycle error message.

### Unit Tests for User Story 3

- [ ] T019 [P] [US3] Add unit tests to `packages/nadle/test/unit/task-scheduler.test.ts` for cycle detection with implicit deps. Test cases: (1) circular workspace deps (A depends on B, B depends on A) with same-name tasks — cycle detected; (2) cycle from combined explicit + implicit edges (A:build -> B:test explicit, B workspace depends on A, so B:build -> A:build implicit, A:build -> B:test -> ??? — no cycle unless B:test depends on B:build); (3) redundant explicit + implicit edge to same target — no false cycle; (4) long implicit chain that forms a cycle — correct path in error message.

### Implementation for User Story 3

- [ ] T020 [US3] No algorithm change required (per research R3 — current DFS handles implicit edges correctly since they're added before cycle detection runs). Verify by running T019 tests. If any fail, investigate edge cases in `detectCycle()` in `packages/nadle/src/core/engine/task-scheduler.ts`. Depends on T011, T017.

- [ ] T021 [US3] Write integration test in `packages/nadle/test/features/workspaces/workspaces-implicit-deps.test.ts` (append). Test cases: (1) circular workspace deps — both have `build` — error message contains cycle path; (2) circular workspace deps — only one has `build` — no cycle (implicit dep skipped); (3) error message includes workspace-qualified task names (e.g., `packages:a:build -> packages:b:build -> packages:a:build`). Depends on T020.

**Checkpoint**: Cycle detection handles all implicit dependency scenarios. Error messages are clear and include full paths.

---

## Phase 5: User Story 4 — Performance (Priority: P3)

**Goal**: Scheduling remains fast for large monorepos. Task-by-name lookups are O(1) via the name index (already implemented in T003).

**Independent Test**: Benchmark scheduling time with synthetic monorepo of 100+ workspaces.

- [ ] T022 [US4] Verify `nameIndex` performance by adding a unit test to `packages/nadle/test/unit/task-scheduler.test.ts` that creates a mock with 500 tasks across 100 workspaces, runs `scheduler.init()`, and asserts completion in under 100ms using `performance.now()`. This validates FR-008 (indexed lookups) and SC-002 (<100ms scheduling). Depends on T003, T006.

**Checkpoint**: Name index is O(1). Scheduling performance is validated for large task counts.

---

## Phase 6: User Story 5 — Dry-Run Visibility (Priority: P3)

**Goal**: `--dry-run` output shows implicit vs explicit dependencies so users can understand scheduling decisions.

**Independent Test**: Run `nadle build --dry-run` on a monorepo with implicit deps, verify output distinguishes dependency types.

- [ ] T023 [US5] Modify `TaskScheduler` in `packages/nadle/src/core/engine/task-scheduler.ts` to track which dependency edges are implicit vs explicit. Add a private `implicitEdges: Set<string>` (storing `"sourceId->targetId"` strings) populated during `analyze()` when implicit deps are added. Expose via a `getImplicitEdges()` method or include in the execution plan metadata.

- [ ] T024 [US5] Update the dry-run handler in `packages/nadle/src/core/handlers/dry-run-handler.ts` to read implicit edge metadata from the scheduler and annotate the execution plan output. Mark implicit dependencies with a visual indicator (e.g., `(implicit)` suffix or different formatting). Depends on T023.

- [ ] T025 [US5] Write integration test in `packages/nadle/test/features/workspaces/workspaces-implicit-deps.test.ts` (append). Test cases: (1) `--dry-run` with implicit deps — output contains implicit dependency indicator; (2) `--dry-run` with mixed explicit and implicit deps — both types visible. Depends on T024.

**Checkpoint**: Dry-run output clearly shows implicit dependencies. Users can debug scheduling decisions.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Specification updates, documentation, API surface tracking, and final validation.

- [ ] T026 [P] Update `spec/03-scheduling.md` — add new section "Implicit Workspace Dependencies" documenting: how workspace `package.json` deps create same-name task deps, root task aggregation, the `implicitDependencies` option, interaction with `--exclude`, and that implicit edges are injected during analysis before cycle detection. Update "Workspace Task Expansion" section to document root aggregation behavior.

- [ ] T027 [P] Update `spec/07-workspace.md` — add note in "Workspace Dependencies" section that workspace dependencies now create task dependencies by default (previously informational only). Reference `implicitDependencies` option. Note the `workspace:*` protocol requirement.

- [ ] T028 [P] Update `spec/CHANGELOG.md` with entry for implicit workspace task dependencies, root task aggregation, `implicitDependencies` option, scheduler DI refactoring, and task-by-name index. Bump version in `spec/README.md` from 1.4.0 to 1.5.0.

- [ ] T029 [P] Update user-facing docs in `packages/docs/` if workspace-related pages exist. Add section on implicit task dependencies to workspace concepts page. Add `implicitDependencies` to config reference. Update monorepo setup guide.

- [ ] T030 Run `npx nadle build` to regenerate `packages/nadle/index.api.md` with the new `implicitDependencies` public API surface. Verify the diff shows only the expected addition. Depends on all implementation tasks.

- [ ] T031 Verify bundle size stays under 140 KB limit by running `pnpm -F nadle size-limit` or equivalent. If over budget, investigate and trim. Depends on T030.

- [ ] T032 Run full CI pipeline: `npx nadle check build test --summary`. All checks, builds, and tests must pass on local machine before PR. Depends on all previous tasks.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately. BLOCKS all user stories.
- **Phase 2 (US1)**: Depends on Phase 1 completion.
- **Phase 3 (US2)**: Depends on Phase 2 (US1) — root aggregation builds on implicit dep infrastructure.
- **Phase 4 (US3)**: Depends on Phase 2 (US1) + Phase 3 (US2) — tests combined implicit + aggregation cycles.
- **Phase 5 (US4)**: Depends on Phase 1 (T003 name index). Can start after Phase 1 independently.
- **Phase 6 (US5)**: Depends on Phase 2 (US1) — needs implicit dep metadata to display.
- **Phase 7 (Polish)**: Depends on all user stories.

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1 only. No cross-story dependencies. **MVP target.**
- **US2 (P2)**: Depends on US1 (uses implicit dep infrastructure for aggregation).
- **US3 (P2)**: Depends on US1 + US2 (tests cycles from both implicit deps and aggregation).
- **US4 (P3)**: Depends on Phase 1 only (name index). Independent of US1-US3.
- **US5 (P3)**: Depends on US1 (needs implicit edge metadata).

### Parallel Opportunities

Within Phase 1:

- T001, T002, T003 can run in parallel (different files, no dependencies)
- T006 depends on T004

Within Phase 2 (US1):

- T008, T009 can run in parallel (different test files)
- T010 is independent of tests

Within Phase 7 (Polish):

- T026, T027, T028, T029 can all run in parallel (different files)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational DI refactoring (T001-T007)
2. Complete Phase 2: US1 — Implicit Dependencies (T008-T015)
3. **STOP and VALIDATE**: Run `pnpm -F nadle test` — all tests pass, implicit deps work
4. This delivers the core value: `nadle build` respects workspace dependency ordering

### Incremental Delivery

1. Phase 1 (Foundation) → DI refactoring, testable scheduler
2. Phase 2 (US1) → Implicit deps (MVP!)
3. Phase 3 (US2) → Root aggregation
4. Phase 4 (US3) → Cycle detection validation
5. Phase 5 (US4) → Performance verification
6. Phase 6 (US5) → Dry-run visibility
7. Phase 7 (Polish) → Spec, docs, API tracking, bundle size

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- Tests are included — user requested heavy unit tests with DI isolation
- Constitution IV compliance: integration tests remain primary; unit tests supplement
- Build (`pnpm -F nadle build:tsup`) is required before running integration tests
- Commit after each phase completion for clean git history
- Max 200 lines/file, 50 lines/function, complexity 10 — enforced by eslint
