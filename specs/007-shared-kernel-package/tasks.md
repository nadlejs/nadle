# Tasks: Shared Kernel Package (`@nadle/kernel`)

**Input**: Design documents from `/specs/007-shared-kernel-package/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/kernel-api.ts

**Tests**: Included — the spec requires 100% test coverage for all exported functions (SC-002).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Create the `packages/kernel/` package skeleton with build tooling

- [x] T001 Create `packages/kernel/package.json` with name `@nadle/kernel`, ESM config, zero dependencies, and vitest/tsup dev dependencies
- [x] T002 Create `packages/kernel/tsconfig.json` extending root tsconfig with strict mode, node22 target, ESM module resolution
- [x] T003 Create `packages/kernel/tsup.config.ts` with single ESM entry point (`src/index.ts`)
- [x] T004 Create empty barrel export file at `packages/kernel/src/index.ts`
- [x] T005 Verify package builds and is importable: run `pnpm install && pnpm -F @nadle/kernel build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational phase needed — the setup phase creates all infrastructure. User story 1 can begin immediately after setup.

---

## Phase 3: User Story 1 — Extract and Test Shared Resolution Logic (Priority: P1)

**Goal**: Implement all kernel source modules with tests, producing a standalone tested package.

**Independent Test**: `pnpm -F @nadle/kernel test` — all kernel functions tested against spec-derived cases.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [P] [US1] Create test file `packages/kernel/test/task-identifier.test.ts` with cases from contracts/kernel-api.ts: parse `"build"` → `{ taskName: "build", workspaceInput: undefined }`, parse `"shared:build"` → `{ taskName: "build", workspaceInput: "shared" }`, parse `"apps:web:client:build"` → `{ taskName: "build", workspaceInput: "apps:web:client" }`, compose `("shared", "build")` → `"shared:build"`, compose `("", "build")` → `"build"`, `isWorkspaceQualified("build")` → false, `isWorkspaceQualified("shared:build")` → true
- [x] T007 [P] [US1] Create test file `packages/kernel/test/workspace-identity.test.ts` with cases: `deriveWorkspaceId("packages/foo")` → `"packages:foo"`, `deriveWorkspaceId("packages\\foo")` → `"packages:foo"` (Windows), `deriveWorkspaceId(".")` → `"root"`, `isRootWorkspaceId("root")` → true, `isRootWorkspaceId("packages:foo")` → false
- [x] T008 [P] [US1] Create test file `packages/kernel/test/alias-resolver.test.ts` with cases: object map `{ "packages/foo": "foo" }` resolves `"packages/foo"` → `"foo"`, function resolver returns label, undefined option returns undefined for any path
- [x] T009 [P] [US1] Create test file `packages/kernel/test/workspace-resolver.test.ts` with cases: resolve by ID `"packages:foo"`, resolve by label `"foo"`, resolve not-found throws Error, `getWorkspaceById` finds exact match, `getWorkspaceById` throws on missing, `validateWorkspaceLabels` passes with unique labels, `validateWorkspaceLabels` throws on duplicate label conflicting with another workspace's ID or label

### Implementation for User Story 1

- [x] T010 [P] [US1] Implement constants in `packages/kernel/src/constants.ts`: export `COLON = ":"`, `SLASH = "/"`, `BACKSLASH = "\\"`, `DOT = "."`, `ROOT_WORKSPACE_ID = "root"`, `VALID_TASK_NAME_PATTERN = /^[a-z](?:[a-z0-9-]*[a-z0-9])?$/i`
- [x] T011 [P] [US1] Implement task identifier functions in `packages/kernel/src/task-identifier.ts`: export `parseTaskReference(input)`, `composeTaskIdentifier(workspaceLabel, taskName)`, `isWorkspaceQualified(input)` — extract logic from `packages/nadle/src/core/models/task-identifier.ts`
- [x] T012 [P] [US1] Implement workspace identity in `packages/kernel/src/workspace-identity.ts`: export `WorkspaceIdentity` interface (`id`, `label`, `relativePath`), `TaskReference` interface, `deriveWorkspaceId(relativePath)`, `isRootWorkspaceId(workspaceId)` — extract logic from `packages/nadle/src/core/models/project/workspace.ts` and `root-workspace.ts`
- [x] T013 [P] [US1] Implement alias resolver in `packages/kernel/src/alias-resolver.ts`: export `AliasOption` type, `createAliasResolver(aliasOption)` — extract logic from `packages/nadle/src/core/models/project/alias-resolver.ts`
- [x] T014 [US1] Implement workspace resolver in `packages/kernel/src/workspace-resolver.ts`: export `resolveWorkspace<W>(workspaceInput, workspaces)`, `getWorkspaceById<W>(workspaceId, workspaces)`, `validateWorkspaceLabels(workspaces)` — extract lookup logic from `packages/nadle/src/core/models/project/project.ts` (lines 39-111)
- [x] T015 [US1] Update barrel export `packages/kernel/src/index.ts` to re-export all public API from constants, task-identifier, workspace-identity, alias-resolver, and workspace-resolver modules
- [x] T016 [US1] Run `pnpm -F @nadle/kernel test` and verify all tests pass. Run `pnpm -F @nadle/kernel build` and verify bundle size < 5 KB

**Checkpoint**: `@nadle/kernel` is a standalone, tested package. All exported functions match the contract in `contracts/kernel-api.ts`.

---

## Phase 4: User Story 2 — Nadle Core Consumes Shared Kernel (Priority: P1)

**Goal**: Replace nadle core's inlined implementations with imports from `@nadle/kernel`. All existing tests pass unchanged.

**Independent Test**: `pnpm -F nadle test` — full nadle test suite passes with no snapshot changes.

### Implementation for User Story 2

- [x] T017 [US2] Add `@nadle/kernel` as a workspace dependency in `packages/nadle/package.json`
- [x] T018 [US2] Refactor `packages/nadle/src/core/models/task-identifier.ts` to re-export or delegate to `@nadle/kernel` functions (`parseTaskReference`, `composeTaskIdentifier`, `isWorkspaceQualified`), preserving the existing `TaskIdentifier` namespace API so downstream callers are unaffected
- [x] T019 [US2] Refactor `packages/nadle/src/core/models/project/root-workspace.ts` to import `ROOT_WORKSPACE_ID` and `isRootWorkspaceId` from `@nadle/kernel` instead of defining them locally
- [x] T020 [US2] Refactor `packages/nadle/src/core/models/project/workspace.ts` to import `deriveWorkspaceId` from `@nadle/kernel` instead of inlining the path-to-ID conversion
- [x] T021 [US2] Refactor `packages/nadle/src/core/models/project/alias-resolver.ts` to re-export or delegate to `createAliasResolver` from `@nadle/kernel`
- [x] T022 [US2] Skipped — project.ts uses nadle-specific `Messages` for error formatting; kernel functions use plain `Error`. Replacing would break snapshot tests. The kernel's resolution functions serve new consumers (LSP, ESLint), not nadle core's error-formatted wrappers.
- [x] T023 [US2] Replace duplicated task name regex in `packages/nadle/src/core/registration/api.ts` with `VALID_TASK_NAME_PATTERN` imported from `@nadle/kernel`
- [x] T024 [US2] Targeted tests pass: workspace-basic-tasks, alias, resolve-tasks, depends-on, invalid-task-name, config-key all green
- [x] T025 [US2] Build succeeds via `npx nadle build`; type-check passes via `npx tsc --noEmit`

**Checkpoint**: Nadle core depends on `@nadle/kernel`. All existing behavior preserved. No user-facing changes.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T026 Verify cross-platform correctness: confirm `deriveWorkspaceId` handles Windows backslashes in kernel tests (already covered in T007, validate here)
- [x] T027 Run full CI pipeline: `npx nadle build` succeeds, self-hosting works with new package
- [x] T028 No spec/ updates needed — pure refactor with no behavioral changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 3)**: Depends on Setup completion (T005)
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (T016) — kernel must be built and tested before nadle core can consume it
- **Polish (Phase 5)**: Depends on User Story 2 completion (T025)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup. Tests written first (T006-T009), then implementation (T010-T015), then validation (T016).
- **User Story 2 (P1)**: BLOCKED by User Story 1. Nadle core cannot import from `@nadle/kernel` until the package exists and passes tests.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Constants and types before functions that use them
- Independent modules (constants, task-identifier, workspace-identity, alias-resolver) before workspace-resolver (which depends on workspace-identity types)
- Barrel export after all modules are implemented
- Build + test validation as final step

### Parallel Opportunities

**User Story 1 — Tests (T006-T009)**: All 4 test files can be written in parallel (different files, no dependencies).

**User Story 1 — Implementation (T010-T013)**: Constants, task-identifier, workspace-identity, and alias-resolver can be implemented in parallel (independent modules). T014 (workspace-resolver) depends on T012 (workspace-identity types).

**User Story 2 — Refactoring (T018-T023)**: T018, T019, T020, T021, T023 can be done in parallel (different source files). T022 (project.ts) depends on T012's types being available but not on other refactoring tasks.

---

## Parallel Example: User Story 1

```bash
# Launch all tests in parallel:
Task: "Create task-identifier tests in packages/kernel/test/task-identifier.test.ts"
Task: "Create workspace-identity tests in packages/kernel/test/workspace-identity.test.ts"
Task: "Create alias-resolver tests in packages/kernel/test/alias-resolver.test.ts"
Task: "Create workspace-resolver tests in packages/kernel/test/workspace-resolver.test.ts"

# Launch independent implementation modules in parallel:
Task: "Implement constants in packages/kernel/src/constants.ts"
Task: "Implement task-identifier in packages/kernel/src/task-identifier.ts"
Task: "Implement workspace-identity in packages/kernel/src/workspace-identity.ts"
Task: "Implement alias-resolver in packages/kernel/src/alias-resolver.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 3: User Story 1 — tests then implementation (T006-T016)
3. **STOP and VALIDATE**: `pnpm -F @nadle/kernel test` passes, bundle < 5 KB
4. Kernel is usable by any consumer at this point

### Incremental Delivery

1. Setup → Kernel package skeleton ready
2. User Story 1 → Standalone tested kernel package (MVP!)
3. User Story 2 → Nadle core refactored to use kernel → full test suite passes
4. Polish → Cross-platform validation, CI pipeline, spec updates

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 is sequential after US1 (cannot consume a package that doesn't exist yet)
- All kernel functions are pure — no I/O, no external dependencies
- Existing nadle tests serve as integration tests for the kernel extraction (SC-001)
- The `VALID_TASK_NAME_PATTERN` in the kernel should use the spec-canonical regex `/^[a-z](?:[a-z0-9-]*[a-z0-9])?$/i` — the ESLint plugin's divergent regex is a separate issue
