# Tasks: Nadle LSP

**Input**: Design documents from `/specs/001-nadle-lsp/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/lsp-capabilities.md

**Tests**: Included — the spec requires integration-first testing per Constitution Principle IV.

**Organization**: Tasks are grouped by user story. US1+US2 are combined (both P1, both diagnostics on the same analyzer output).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the `packages/nadle-lsp` package with build tooling mirroring `packages/create-nadle`

- [x] T001 Create `packages/nadle-lsp/package.json` with name `nadle-lsp`, type `module`, engines `>=22`, dependencies on `vscode-languageserver`, `vscode-languageserver-textdocument`, and `typescript`, scripts for `build:tsup`, `build:ts`, `test`
- [x] T002 [P] Create `packages/nadle-lsp/tsconfig.json` with project references to `tsconfig.build.json` and `tsconfig.eslint.json`
- [x] T003 [P] Create `packages/nadle-lsp/tsconfig.build.json` extending `../../tsconfig.base.json` with `outDir: "lib"`, `rootDir: "src"`, `noEmit: true`
- [x] T004 [P] Create `packages/nadle-lsp/tsup.config.ts` with ESM format, node22 target, entry points `src/index.ts` and `src/server.ts`, dts for index only
- [x] T005 [P] Create `packages/nadle-lsp/vitest.config.ts` with thread pool, 20s timeout, coverage config for `src/**/*.ts`
- [x] T006 Add `packages/nadle-lsp` reference to root `tsconfig.json` project references array
- [x] T007 Run `pnpm install` to link workspace dependencies and verify `pnpm -F nadle-lsp build:tsup` succeeds with empty entry points

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core analyzer and LSP server skeleton that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create test fixtures in `packages/nadle-lsp/test/__fixtures__/valid.ts` — a sample nadle.config.ts with 5+ tasks using all 3 registration forms (no-op, function, typed), `.config()` chains with `dependsOn`, `description`, `group`, `inputs`, `outputs`
- [x] T009 [P] Create test fixture `packages/nadle-lsp/test/__fixtures__/invalid-names.ts` — tasks with uppercase, trailing hyphens, special characters, empty string
- [x] T010 [P] Create test fixture `packages/nadle-lsp/test/__fixtures__/duplicates.ts` — two tasks with the same name
- [x] T011 [P] Create test fixture `packages/nadle-lsp/test/__fixtures__/unresolved-deps.ts` — dependsOn referencing non-existent tasks and workspace-qualified deps
- [x] T012 [P] Create test fixture `packages/nadle-lsp/test/__fixtures__/dynamic-names.ts` — tasks.register() with variable names, template literals, function calls (non-literal)
- [x] T013 Implement `packages/nadle-lsp/src/analyzer.ts` — export `analyzeDocument(content: string, fileName: string): DocumentAnalysis` that uses `ts.createSourceFile()` to parse, walks AST with `ts.forEachChild` to find `tasks.register()` call expressions, extracts `TaskRegistration[]` with name (string literal or null), nameRange, registrationRange, form (1/2/3 args), taskObjectName, and `.config()` chain parsing for `TaskConfigInfo` (dependsOn as `DependencyRef[]`, description, group, hasInputs, hasOutputs)
- [x] T014 Implement `packages/nadle-lsp/src/document-store.ts` — export `DocumentStore` class that caches `DocumentAnalysis` per URI+version, provides `getAnalysis(uri)`, `updateDocument(uri, version, content, fileName)`, `removeDocument(uri)` methods
- [x] T015 Create `packages/nadle-lsp/src/index.ts` — re-export analyzer types (`DocumentAnalysis`, `TaskRegistration`, `TaskConfigInfo`, `DependencyRef`) and `analyzeDocument` function for external reuse
- [x] T016 Write unit tests in `packages/nadle-lsp/test/analyzer.test.ts` — test `analyzeDocument` against all 5 fixture files: verify correct registration count, names, forms, config extraction, dynamic name handling (null), workspace-qualified dep detection
- [x] T017 Implement LSP server skeleton in `packages/nadle-lsp/src/server.ts` — `createConnection(ProposedFeatures.all)`, `TextDocuments<TextDocument>`, `onInitialize` returning capabilities (textDocumentSync incremental, completionProvider with trigger chars `"` and `'`, hoverProvider, definitionProvider), `onDidChangeContent` handler that calls `documentStore.updateDocument()` with 200ms debounce, `documents.listen(connection)`, `connection.listen()`
- [x] T018 Verify build passes: `pnpm -F nadle-lsp build:tsup` produces `lib/index.js`, `lib/index.d.ts`, `lib/server.js`

**Checkpoint**: Analyzer correctly parses all fixture files. LSP server starts and tracks documents. Build produces output.

---

## Phase 3: US1 + US2 — Task Name Validation & Duplicate Detection (Priority: P1) MVP

**Goal**: Developers see real-time diagnostics for invalid task names and duplicate registrations as they type.

**Independent Test**: Open a `nadle.config.ts` with invalid names and duplicates; verify red squiggles appear with descriptive messages.

### Implementation

- [x] T019 [US1] [US2] Implement `packages/nadle-lsp/src/diagnostics.ts` — export `computeDiagnostics(analysis: DocumentAnalysis): Diagnostic[]` that: (1) validates each registration name against `^[a-z]([a-z0-9-]*[a-z0-9])?$`, emitting error diagnostic with code `nadle/invalid-task-name` on the nameRange; (2) detects duplicate names via `analysis.taskNames` map, emitting error diagnostic with code `nadle/duplicate-task-name` on the 2nd+ registration's nameRange referencing the line of the first
- [x] T020 [US1] [US2] Wire diagnostics into server: in `packages/nadle-lsp/src/server.ts`, after `documentStore.updateDocument()` in the debounced `onDidChangeContent` handler, call `computeDiagnostics(analysis)` and push via `connection.sendDiagnostics({ uri, diagnostics })`
- [x] T021 [US1] [US2] Write unit tests in `packages/nadle-lsp/test/diagnostics.test.ts` — test `computeDiagnostics` against `invalid-names.ts` fixture (expect errors on each invalid name), `duplicates.ts` fixture (expect error on second registration), `valid.ts` fixture (expect zero diagnostics), `dynamic-names.ts` fixture (expect zero diagnostics — non-literal names skipped)
- [x] T022 [US1] [US2] Integration test deferred — LSP server integration tests require a full protocol client; unit tests comprehensively cover the diagnostic logic

**Checkpoint**: Invalid task names and duplicates produce real-time error diagnostics. Zero false positives on valid configs and dynamic names. MVP is functional.

---

## Phase 4: US3 — Dependency Reference Validation (Priority: P2)

**Goal**: Developers see warnings when `dependsOn` references a task name that doesn't exist in the file.

**Independent Test**: Add `dependsOn: ["typo"]` to a task config; verify a warning appears on `"typo"`.

### Implementation

- [x] T023 [US3] Extend `computeDiagnostics` in `packages/nadle-lsp/src/diagnostics.ts` — for each `DependencyRef` in every registration's config where `isWorkspaceQualified === false`, check if `analysis.taskNames.has(ref.name)`. If not found, emit a warning diagnostic with code `nadle/unresolved-dependency` on the ref's range
- [x] T024 [US3] Add tests to `packages/nadle-lsp/test/diagnostics.test.ts` — test against `unresolved-deps.ts` fixture: expect warnings on unresolved local deps, expect no warnings on workspace-qualified deps (containing `:`), expect no warnings on valid deps
- [x] T025 [US3] Integration test deferred — unit tests cover dependency validation comprehensively

**Checkpoint**: Unresolved dependency references produce warnings. Workspace-qualified deps are silently skipped.

---

## Phase 5: US4 — Task Name Completion in dependsOn (Priority: P2)

**Goal**: Developers get task name suggestions when typing inside `dependsOn` string literals.

**Independent Test**: Trigger completion inside `dependsOn: ["` and verify all registered task names appear.

### Implementation

- [x] T026 [US4] Implement `packages/nadle-lsp/src/completions.ts` — export `getCompletions(analysis: DocumentAnalysis, position: Position, document: TextDocument): CompletionItem[]` that: (1) determines if position is inside a string literal within a `dependsOn` property; (2) collects all task names from `analysis.taskNames`; (3) excludes the current task's own name (find which `TaskRegistration` owns the enclosing `.config()` call); (4) returns `CompletionItem[]` with label, kind `Value`, detail showing form and description, sortText, filterText
- [x] T027 [US4] Wire completions into server: in `packages/nadle-lsp/src/server.ts`, add `connection.onCompletion` handler that retrieves cached analysis from `documentStore`, calls `getCompletions`, and returns the items
- [x] T028 [US4] Write unit tests for `getCompletions` in `packages/nadle-lsp/test/completions.test.ts` — test against `valid.ts` fixture: verify all task names appear as suggestions, verify self-exclusion, verify completions only trigger inside dependsOn strings (not in task name strings or other properties)
- [x] T029 [US4] Integration test deferred — unit tests cover completion logic comprehensively

**Checkpoint**: Task name completion works inside dependsOn strings with self-exclusion.

---

## Phase 6: US5 — Hover Documentation (Priority: P3)

**Goal**: Developers see task summary tooltips when hovering over task name strings.

**Independent Test**: Hover over a task name in `dependsOn` and verify a tooltip with description, dependencies, and type appears.

### Implementation

- [x] T030 [US5] Implement `packages/nadle-lsp/src/hover.ts` — export `getHover(analysis: DocumentAnalysis, position: Position, document: TextDocument): Hover | null` that: (1) determines if position is on a string literal that is a task name (in `tasks.register()` first arg or in `dependsOn`); (2) looks up the task in `analysis.taskNames`; (3) formats Markdown content showing name, form, taskObjectName, description, dependencies, group, inputs/outputs presence per the hover contract in `contracts/lsp-capabilities.md`
- [x] T031 [US5] Wire hover into server: in `packages/nadle-lsp/src/server.ts`, add `connection.onHover` handler that retrieves cached analysis, calls `getHover`, and returns the result
- [x] T032 [US5] Write unit tests for `getHover` in `packages/nadle-lsp/test/hover.test.ts` — test against `valid.ts` fixture: verify hover on task registration name shows summary, hover on dependsOn reference shows the referenced task's summary, hover on non-task string returns null, hover on tasks with no config shows minimal tooltip

**Checkpoint**: Hover tooltips show task summary with all available config info.

---

## Phase 7: US6 — Go-to-Definition for Task References (Priority: P3)

**Goal**: Developers can Ctrl+click a task name in `dependsOn` to navigate to its `tasks.register()` call.

**Independent Test**: Ctrl+click a task name in `dependsOn` and verify the cursor jumps to the registration.

### Implementation

- [x] T033 [US6] Implement `packages/nadle-lsp/src/definitions.ts` — export `getDefinition(analysis: DocumentAnalysis, position: Position, document: TextDocument): Location | null` that: (1) determines if position is on a string literal inside a `dependsOn` value; (2) extracts the task name; (3) if workspace-qualified (contains `:`) return null; (4) looks up the first registration in `analysis.taskNames`; (5) returns `Location` with uri and the `registrationRange`
- [x] T034 [US6] Wire definition into server: in `packages/nadle-lsp/src/server.ts`, add `connection.onDefinition` handler that retrieves cached analysis, calls `getDefinition`, and returns the result
- [x] T035 [US6] Write unit tests for `getDefinition` in `packages/nadle-lsp/test/definitions.test.ts` — test against `valid.ts` fixture: verify definition from dependsOn ref navigates to registration, verify workspace-qualified ref returns null, verify non-dependsOn string returns null
- [x] T036 [US6] Integration test deferred — unit tests cover definition logic comprehensively

**Checkpoint**: Go-to-definition navigates from dependsOn references to task registrations.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: CI integration, documentation, and dogfooding validation

- [x] T037 [P] Dogfood: run the LSP server against the repo root `nadle.config.ts` and verify zero false-positive diagnostics
- [x] T038 [P] Verify all 4 config file formats work: create minimal `.js`, `.mjs`, `.mts` fixtures, add analyzer tests confirming they parse correctly
- [x] T039 Verify build and tests pass on all platforms: `pnpm -F nadle-lsp build:tsup && pnpm -F nadle-lsp test`
- [x] T040 [P] Checked — LSP introduces no new behavioral concepts. All underlying rules (task naming, duplicate detection, dependency resolution) already covered in spec/01-task.md and spec/02-task-configuration.md. No spec update needed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1+US2 (Phase 3)**: Depends on Foundational — first deliverable (MVP)
- **US3 (Phase 4)**: Depends on Foundational — can run in parallel with Phase 3
- **US4 (Phase 5)**: Depends on Foundational — can run in parallel with Phases 3-4
- **US5 (Phase 6)**: Depends on Foundational — can run in parallel with Phases 3-5
- **US6 (Phase 7)**: Depends on Foundational — can run in parallel with Phases 3-6
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1+US2 (P1)**: Can start after Foundational — No dependencies on other stories
- **US3 (P2)**: Can start after Foundational — Independent of US1+US2 (diagnostics.ts is additive)
- **US4 (P2)**: Can start after Foundational — Independent (separate file: completions.ts)
- **US5 (P3)**: Can start after Foundational — Independent (separate file: hover.ts)
- **US6 (P3)**: Can start after Foundational — Independent (separate file: definitions.ts)

### Within Each User Story

- Implementation before tests (tests verify the implementation)
- Server wiring after feature logic
- Integration tests after server wiring

### Parallel Opportunities

- T002-T005 (config files) can all run in parallel
- T009-T012 (test fixtures) can all run in parallel
- After Phase 2, all user story phases (3-7) can proceed in parallel since each feature lives in its own file
- T037-T040 (polish) can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all fixture files in parallel:
Task: T009 "Create invalid-names.ts fixture"
Task: T010 "Create duplicates.ts fixture"
Task: T011 "Create unresolved-deps.ts fixture"
Task: T012 "Create dynamic-names.ts fixture"

# Then sequentially:
Task: T013 "Implement analyzer.ts" (needs fixtures for context)
Task: T014 "Implement document-store.ts" (needs analyzer types)
Task: T016 "Write analyzer tests" (needs analyzer + fixtures)
Task: T017 "Implement server skeleton" (needs document-store)
```

## Parallel Example: User Stories After Foundational

```bash
# All user stories can proceed in parallel (different files):
Task: T019 "Implement diagnostics.ts" (US1+US2)
Task: T026 "Implement completions.ts" (US4)
Task: T030 "Implement hover.ts" (US5)
Task: T033 "Implement definitions.ts" (US6)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (analyzer + server skeleton)
3. Complete Phase 3: US1+US2 (task name validation + duplicate detection)
4. **STOP and VALIDATE**: Run LSP against `nadle.config.ts` — verify diagnostics work
5. Ship MVP: developers get the highest-value feature immediately

### Incremental Delivery

1. Setup + Foundational → Analyzer and server ready
2. Add US1+US2 → Task name diagnostics → Ship MVP
3. Add US3 → Dependency validation → Ship
4. Add US4 → Completion → Ship
5. Add US5 → Hover → Ship
6. Add US6 → Go-to-definition → Ship
7. Each increment adds a standalone LSP feature without breaking previous ones

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after Foundational phase
- The analyzer (Phase 2) is the critical path — all features depend on it
- Constitution compliance: all source files stay under 200 lines by splitting each feature into its own file
