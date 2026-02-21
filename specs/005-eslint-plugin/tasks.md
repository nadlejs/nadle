# Tasks: ESLint Plugin for Nadle

**Input**: Design documents from `/specs/005-eslint-plugin/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/plugin-api.md

**Tests**: Included per FR-018 — all rules must have tests using vitest and @typescript-eslint/rule-tester.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Package initialization, ESM rewrite, shared utilities, release config

- [x] T001 Rewrite plugin entry from CJS to ESM with static rule imports in `packages/eslint-plugin/src/index.ts`
- [x] T002 Create shared AST utility helpers (`isTasksRegisterCall`, `getTaskName`, `getConfigObject`, `isInTaskAction`) in `packages/eslint-plugin/src/utils/ast-helpers.ts`
- [x] T003 [P] Add `packages/eslint-plugin` entry to `release-please-config.json` and `.release-please-manifest.json`
- [x] T004 [P] Add nadle.config.ts for the eslint-plugin package with build (tsc) and test tasks in `packages/eslint-plugin/nadle.config.ts`
- [x] T005 [P] Add project reference for eslint-plugin to root `tsconfig.json`

**Checkpoint**: Package compiles with tsc, plugin exports empty rules/configs, release-please configured.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Test infrastructure that all rule tests depend on

**CRITICAL**: No rule implementation can produce tests until this phase is complete.

- [x] T006 Configure RuleTester with vitest (`RuleTester.afterAll`) and create test helper in `packages/eslint-plugin/test/helpers.ts`

**Checkpoint**: A minimal placeholder rule can be tested with RuleTester. Foundation ready.

---

## Phase 3: User Story 1 - Catch Common Config Mistakes (Priority: P1) MVP

**Goal**: 7 correctness and best-practice rules catch config mistakes at authoring time.

**Independent Test**: Create nadle config files with known issues and verify ESLint reports expected diagnostics.

### Implementation for User Story 1

- [x] T007 [P] [US1] Implement `no-anonymous-tasks` rule in `packages/eslint-plugin/src/rules/no-anonymous-tasks.ts`
- [x] T008 [P] [US1] Implement `no-duplicate-task-names` rule in `packages/eslint-plugin/src/rules/no-duplicate-task-names.ts`
- [x] T009 [P] [US1] Implement `valid-task-name` rule in `packages/eslint-plugin/src/rules/valid-task-name.ts`
- [x] T010 [P] [US1] Implement `valid-depends-on` rule in `packages/eslint-plugin/src/rules/valid-depends-on.ts`
- [x] T011 [P] [US1] Implement `no-circular-dependencies` rule with DFS cycle detection in `packages/eslint-plugin/src/rules/no-circular-dependencies.ts`
- [x] T012 [P] [US1] Implement `require-task-description` rule in `packages/eslint-plugin/src/rules/require-task-description.ts`
- [x] T013 [P] [US1] Implement `require-task-inputs` rule in `packages/eslint-plugin/src/rules/require-task-inputs.ts`

### Tests for User Story 1

- [x] T014 [P] [US1] Write tests for `no-anonymous-tasks` (>=3 valid, >=3 invalid cases) in `packages/eslint-plugin/test/rules/no-anonymous-tasks.test.ts`
- [x] T015 [P] [US1] Write tests for `no-duplicate-task-names` (>=3 valid, >=3 invalid cases) in `packages/eslint-plugin/test/rules/no-duplicate-task-names.test.ts`
- [x] T016 [P] [US1] Write tests for `valid-task-name` (>=3 valid, >=3 invalid cases) in `packages/eslint-plugin/test/rules/valid-task-name.test.ts`
- [x] T017 [P] [US1] Write tests for `valid-depends-on` (>=3 valid, >=3 invalid cases) in `packages/eslint-plugin/test/rules/valid-depends-on.test.ts`
- [x] T018 [P] [US1] Write tests for `no-circular-dependencies` (>=3 valid, >=3 invalid cases including transitive cycles) in `packages/eslint-plugin/test/rules/no-circular-dependencies.test.ts`
- [x] T019 [P] [US1] Write tests for `require-task-description` (>=3 valid, >=3 invalid cases) in `packages/eslint-plugin/test/rules/require-task-description.test.ts`
- [x] T020 [P] [US1] Write tests for `require-task-inputs` (>=3 valid, >=3 invalid cases) in `packages/eslint-plugin/test/rules/require-task-inputs.test.ts`

**Checkpoint**: All 7 correctness/best-practice rules pass their test suites. Plugin entry re-exports all rules.

---

## Phase 4: User Story 2 - One-Line Plugin Setup (Priority: P2)

**Goal**: `recommended` and `all` config presets work with a single spread in ESLint flat config.

**Independent Test**: Import recommended config in an eslint.config.ts, verify rules activate on nadle.config.ts files.

### Implementation for User Story 2

- [x] T021 [US2] Build `recommended` and `all` config presets with `files: ["**/nadle.config.*"]` and severity mapping in `packages/eslint-plugin/src/index.ts`

### Tests for User Story 2

- [x] T022 [US2] Write config preset tests verifying structure, rule count, file scoping, and severity in `packages/eslint-plugin/test/configs.test.ts`

**Checkpoint**: Both presets export correctly. Spreading `nadle.configs.recommended` activates rules scoped to nadle config files.

---

## Phase 5: User Story 3 - Enforce Best Practices in Task Actions (Priority: P3)

**Goal**: Rules warn about sync APIs and `process.cwd()` inside task action scopes, and enforce padding between task registrations.

**Independent Test**: Write task actions with sync calls and process.cwd(), verify warnings. Write consecutive task registrations without blank lines, verify autofix.

### Implementation for User Story 3

- [x] T023 [P] [US3] Implement `no-sync-in-task-action` rule (flag `readFileSync`, `execSync`, etc. in task action scope) in `packages/eslint-plugin/src/rules/no-sync-in-task-action.ts`
- [x] T024 [P] [US3] Implement `no-process-cwd` rule (flag `process.cwd()` in task action scope) in `packages/eslint-plugin/src/rules/no-process-cwd.ts`
- [x] T025 [P] [US3] Implement `padding-between-tasks` rule with autofix in `packages/eslint-plugin/src/rules/padding-between-tasks.ts`

### Tests for User Story 3

- [x] T026 [P] [US3] Write tests for `no-sync-in-task-action` (>=3 valid, >=3 invalid, including scope checks) in `packages/eslint-plugin/test/rules/no-sync-in-task-action.test.ts`
- [x] T027 [P] [US3] Write tests for `no-process-cwd` (>=3 valid, >=3 invalid, including scope checks) in `packages/eslint-plugin/test/rules/no-process-cwd.test.ts`
- [x] T028 [P] [US3] Write tests for `padding-between-tasks` (>=3 valid, >=3 invalid, verify autofix output) in `packages/eslint-plugin/test/rules/padding-between-tasks.test.ts`

**Checkpoint**: All 3 rules pass tests. Autofix for padding-between-tasks inserts blank lines correctly.

---

## Phase 6: User Story 4 - Suggest Built-in Tasks (Priority: P4)

**Goal**: Suggest built-in task types when custom actions match known patterns.

**Independent Test**: Write task actions using execa/child_process and verify suggestions for ExecTask/PnpmTask.

### Implementation for User Story 4

- [x] T029 [US4] Implement `prefer-builtin-task` rule (detect execa, child_process, fs.cp, rimraf patterns) in `packages/eslint-plugin/src/rules/prefer-builtin-task.ts`

### Tests for User Story 4

- [x] T030 [US4] Write tests for `prefer-builtin-task` (>=3 valid, >=3 invalid, covering ExecTask/PnpmTask/CopyTask/DeleteTask suggestions) in `packages/eslint-plugin/test/rules/prefer-builtin-task.test.ts`

**Checkpoint**: Rule suggests appropriate built-in tasks. All 11 rules complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Integration, self-hosting, documentation, validation

- [x] T031 Add `eslint-plugin-nadle` with recommended config to the monorepo's own `eslint.config.ts`
- [x] T032 Run ESLint against all existing `nadle.config.ts` files to verify zero false positives (SC-003)
- [x] T033 [P] Create ESLint plugin guide in `packages/docs/docs/guides/eslint-plugin.md`
- [x] T034 [P] Update docs sidebar to include ESLint plugin guide in `packages/docs/sidebars.ts`
- [x] T035 Update `packages/eslint-plugin/src/index.ts` to ensure all 11 rules are registered in both presets with correct severity

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001, T002 completion — BLOCKS all test tasks
- **User Story 1 (Phase 3)**: Depends on Phase 2 — rule implementations can start after T002 (ast-helpers); tests after T006
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion (needs rules to reference in presets)
- **User Story 3 (Phase 5)**: Depends on Phase 2 only — can run in parallel with Phase 3
- **User Story 4 (Phase 6)**: Depends on Phase 2 only — can run in parallel with Phase 3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependencies on other stories
- **US2 (P2)**: After US1 (needs rules to build presets)
- **US3 (P3)**: After Phase 2 — independent of US1/US2
- **US4 (P4)**: After Phase 2 — independent of US1/US2/US3

### Parallel Opportunities

- T003, T004, T005 can run in parallel (setup tasks, different files)
- T007–T013 can all run in parallel (rule implementations, each in own file)
- T014–T020 can all run in parallel (test files, each independent)
- T023–T025 can all run in parallel (US3 rules, each in own file)
- T026–T028 can all run in parallel (US3 tests)
- T033, T034 can run in parallel (docs, different files)
- US3 and US4 can run in parallel with US1 (after Phase 2)

---

## Parallel Example: User Story 1

```bash
# Launch all rule implementations in parallel:
T007: no-anonymous-tasks.ts
T008: no-duplicate-task-names.ts
T009: valid-task-name.ts
T010: valid-depends-on.ts
T011: no-circular-dependencies.ts
T012: require-task-description.ts
T013: require-task-inputs.ts

# Then launch all tests in parallel:
T014: no-anonymous-tasks.test.ts
T015: no-duplicate-task-names.test.ts
T016: valid-task-name.test.ts
T017: valid-depends-on.test.ts
T018: no-circular-dependencies.test.ts
T019: require-task-description.test.ts
T020: require-task-inputs.test.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006)
3. Complete Phase 3: User Story 1 (T007–T020)
4. **STOP and VALIDATE**: Run all 7 rule test suites, verify zero false positives on monorepo configs
5. Plugin is usable with manual rule configuration at this point

### Incremental Delivery

1. Setup + Foundational → Package compiles, test infra ready
2. User Story 1 → 7 rules working → Core value delivered
3. User Story 2 → Config presets → One-line setup works
4. User Story 3 → Best practice rules → Performance guidance
5. User Story 4 → Suggestion rule → Built-in task hints
6. Polish → Self-host, docs, release

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each rule file must stay under 200 lines; extract shared logic to `ast-helpers.ts`
- Commit after each completed rule + its test
- Run `tsc -p packages/eslint-plugin/tsconfig.build.json` to verify compilation after each phase
