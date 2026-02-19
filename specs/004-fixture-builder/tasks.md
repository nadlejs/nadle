# Tasks: Fixture Builder

**Input**: Design documents from `/specs/004-fixture-builder/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/builder-api.md

**Tests**: Not explicitly requested. Existing integration tests serve as verification — all migrated tests must continue to pass.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Create the builder infrastructure (new files + modifications to existing setup)

- [x] T001 [P] Create ConfigBuilder class with `configure()`, `task()`, `taskWithConfig()`, `toString()` methods and `config()` factory function in `packages/nadle/test/__setup__/config-builder.ts`
- [x] T002 [P] Create FixtureBuilder class with `packageJson()`, `config()`, `configRaw()`, `file()`, `dir()`, `build()` methods, `fixture()` factory function, and `setNestedPath()` helper in `packages/nadle/test/__setup__/fixture-builder.ts`
- [x] T003 Add `withGeneratedFixture()` function to `packages/nadle/test/__setup__/fs.ts` that writes DirJSON to hashed temp dir, creates `node_modules/nadle` symlink, provides `{ exec, cwd }` callback, and handles cleanup/preserve on failure
- [x] T004 Re-export `config-builder` and `fixture-builder` modules from `packages/nadle/test/__setup__/index.ts`

**Checkpoint**: Builder infrastructure ready. Verify with `npx tsc -p packages/nadle/tsconfig.build.json --noEmit` that types compile.

---

## Phase 2: User Story 1 - Config-only fixtures (Priority: P1)

**Goal**: Migrate worker config fixtures to use the builder, eliminating 8 committed files.

**Independent Test**: `pnpm -F nadle test max-worker min-worker`

- [x] T005 [US1] Migrate `packages/nadle/test/options/max-worker.test.ts` to use `fixture()` + `config()` builder with `withGeneratedFixture` instead of `Path.join(fixturesDir, "workers")`. Build all config variants (config, non-config, max-number, max-percentage, mixed) inline.
- [x] T006 [US1] Migrate `packages/nadle/test/options/min-worker.test.ts` to use `fixture()` + `config()` builder with `withGeneratedFixture` instead of `Path.join(fixturesDir, "workers")`. Build config variants (config, non-config, min-number, min-percentage) inline.
- [x] T007 [US1] Run `pnpm -F nadle test max-worker min-worker` to verify all assertions pass with generated fixtures
- [x] T008 [US1] Delete `packages/nadle/test/__fixtures__/workers/` directory (package.json + 7 config files)

**Checkpoint**: Worker fixtures eliminated. 8 committed files removed.

---

## Phase 3: User Story 2 - Task registration fixtures (Priority: P2)

**Goal**: Migrate invalid-task-name and graceful-cancellation fixtures, eliminating 9 committed files.

**Independent Test**: `pnpm -F nadle test invalid-task-name graceful-cancellation`

- [x] T009 [US2] Migrate `packages/nadle/test/features/invalid-task-name.test.ts` to use `fixture()` + `config().task("invalid-name")` builder with `withGeneratedFixture`. Build all 6 named config variants (colon, empty, underscore, end-with-dash, start-with-dash, start-with-number) inline.
- [x] T010 [US2] Migrate `packages/nadle/test/features/graceful-cancellation.test.ts` to use `fixture()` + `config().task(name, actionString)` builder with `withGeneratedFixture`. Build 3 tasks (success-task with setTimeout, fail-task with throw, main-task with dependsOn config) inline.
- [x] T011 [US2] Run `pnpm -F nadle test invalid-task-name graceful-cancellation` to verify all assertions pass
- [x] T012 [P] [US2] Delete `packages/nadle/test/__fixtures__/invalid-task-name/` directory (package.json + 6 config files)
- [x] T013 [P] [US2] Delete `packages/nadle/test/__fixtures__/graceful-cancellation/` directory (package.json + 1 config file)

**Checkpoint**: Task registration fixtures eliminated. 9 more committed files removed.

---

## Phase 4: User Story 3 - Module format fixtures (Priority: P3)

**Goal**: Migrate config-format discovery fixtures (esm-ts, esm-js, cjs-ts, cjs-js, mixed-ts-js, mixed-ts-mts), eliminating 12 committed files.

**Independent Test**: `pnpm -F nadle test config.test`

- [x] T014 [US3] Migrate `packages/nadle/test/options/config.test.ts` to use `fixture()` builder with `withGeneratedFixture` for all 6 config format variants. Use `configRaw()` for `.js` and `.mts` formats, `packageJson({ type: "commonjs" })` for CJS variants, and multiple config files for mixed-\* variants.
- [x] T015 [US3] Run `pnpm -F nadle test config.test` and update snapshots if needed
- [x] T016 [P] [US3] Delete `packages/nadle/test/__fixtures__/esm-ts/` directory
- [x] T017 [P] [US3] Delete `packages/nadle/test/__fixtures__/esm-js/` directory
- [x] T018 [P] [US3] Delete `packages/nadle/test/__fixtures__/cjs-ts/` directory
- [x] T019 [P] [US3] Delete `packages/nadle/test/__fixtures__/cjs-js/` directory
- [x] T020 [P] [US3] Delete `packages/nadle/test/__fixtures__/mixed-ts-js/` directory
- [x] T021 [P] [US3] Delete `packages/nadle/test/__fixtures__/mixed-ts-mts/` directory

**Checkpoint**: Config format fixtures eliminated. 12 more committed files removed.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T022 Run full test suite `pnpm -F nadle test` to verify no regressions
- [x] T023 Run lint and formatting checks `npx eslint --fix` and `npx prettier --write` on all modified files
- [x] T024 Verify success criteria: count deleted fixture files (target: ≥15), count deleted directories (target: ≥3)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
  - T001 and T002 can run in parallel (different files)
  - T003 depends on T001+T002 (imports ConfigBuilder/FixtureBuilder types)
  - T004 depends on T001+T002 (re-exports the new modules)
- **Phase 2 (US1)**: Depends on Phase 1 completion
- **Phase 3 (US2)**: Depends on Phase 1 completion (independent of Phase 2)
- **Phase 4 (US3)**: Depends on Phase 1 completion (independent of Phase 2 and 3)
- **Phase 5 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 1. Uses `configure()` only — exercises ConfigBuilder.configure().
- **US2 (P2)**: Depends only on Phase 1. Uses `task()` and `taskWithConfig()` — exercises ConfigBuilder.task().
- **US3 (P3)**: Depends only on Phase 1. Uses `configRaw()` and different file extensions — exercises FixtureBuilder.configRaw() and packageJson type field.

### Parallel Opportunities

Within Phase 1:

- T001 (config-builder.ts) and T002 (fixture-builder.ts) in parallel

Within Phase 2 (US1):

- T005 (max-worker) and T006 (min-worker) can potentially run in parallel but share the same fixture definition pattern — better done sequentially for consistency

Across Phases 2-4:

- US1, US2, and US3 are fully independent and can run in parallel after Phase 1

Within Phase 4 (US3):

- T016 through T021 (6 directory deletions) all in parallel after T015

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: US1 worker migration (T005–T008)
3. **STOP and VALIDATE**: Run `pnpm -F nadle test max-worker min-worker`
4. 8 files removed, builder pattern proven

### Incremental Delivery

1. Phase 1 → Builder infrastructure ready
2. Phase 2 (US1) → Worker fixtures removed (8 files) → Validate
3. Phase 3 (US2) → Invalid-task-name + graceful-cancellation removed (9 files) → Validate
4. Phase 4 (US3) → Config format fixtures removed (12 files) → Validate
5. Phase 5 → Full suite verification, cleanup

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story can be implemented and tested independently
- Commit after each phase checkpoint
- Run affected tests after each migration, full suite at the end
- Do NOT migrate fixtures used by multiple test files (FR-014)
