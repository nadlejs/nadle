# Feature Specification: Fixture Builder

**Feature Branch**: `004-fixture-builder`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "Fixture builder: chainable API for programmatic test fixture generation (#421)"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Generate simple config-only fixtures inline (Priority: P1)

As a test author, I want to define test fixtures programmatically using a chainable builder API so that I can eliminate committed fixture files for simple cases (configure-only, single-task registrations).

**Why this priority**: The majority of candidate fixtures are simple config-only files (worker configs, invalid task names). Migrating these delivers the most value with the least effort and proves the builder pattern works.

**Independent Test**: Can be fully tested by migrating the worker config fixtures (`max-worker.test.ts`, `min-worker.test.ts`) and verifying all existing assertions still pass with generated fixtures instead of committed files.

**Acceptance Scenarios**:

1. **Given** a test file that references physical worker config fixtures, **When** the test author replaces physical fixtures with builder calls, **Then** all existing test assertions continue to pass without modification.
2. **Given** a builder configured with a `configure()` call (e.g., `{ maxWorkers: 7 }`), **When** the builder generates a config file, **Then** the output is valid nadle config syntax that nadle can load and execute.
3. **Given** a builder with multiple named config variants (e.g., "max-number", "min-percentage"), **When** the fixture is built, **Then** each variant produces a separate config file with the correct name (`nadle.max-number.ts`, `nadle.min-percentage.ts`).

---

### User Story 2 - Generate fixtures with task registrations (Priority: P2)

As a test author, I want the builder to support task registrations with arbitrary action functions so that I can migrate fixtures like invalid-task-name and graceful-cancellation.

**Why this priority**: Extends the builder beyond configure-only to cover task registration patterns, enabling migration of more fixture categories.

**Independent Test**: Can be tested by migrating `invalid-task-name.test.ts` (tasks with invalid names, no action body) and `graceful-cancellation.test.ts` (tasks with async action bodies) and verifying all assertions pass.

**Acceptance Scenarios**:

1. **Given** a builder with a task registration using no action body (e.g., `tasks.register("build:docker")`), **When** the config is generated, **Then** it produces valid syntax that triggers the expected nadle error for invalid task names.
2. **Given** a builder with a task registration using an inline action string (e.g., `async () => { await new Promise(...) }`), **When** the config is generated, **Then** the action is included verbatim in the output and executes correctly.
3. **Given** a builder with a task that has both an action and a `.config()` block, **When** the config is generated, **Then** the output chains `.config(...)` after `.register(...)` with the correct serialized options.

---

### User Story 3 - Generate fixtures with different module formats (Priority: P3)

As a test author, I want the builder to support different config file extensions (`.ts`, `.js`, `.mts`) and package.json module types (`"module"`, `"commonjs"`) so that I can migrate config-format discovery fixtures.

**Why this priority**: Config-format tests verify nadle's config file discovery behavior, which is sensitive to file extensions and module types. This is the most complex migration category and depends on the builder infrastructure from P1 and P2.

**Independent Test**: Can be tested by migrating `config.test.ts` (6 config format variants) and verifying that nadle still correctly discovers and loads each config format.

**Acceptance Scenarios**:

1. **Given** a builder configured with `packageJson({ type: "commonjs" })` and a config file named `nadle.config.js`, **When** the fixture is written and nadle is invoked, **Then** nadle loads the config as a CommonJS module.
2. **Given** a builder producing both `nadle.config.ts` and `nadle.config.js` in the same fixture, **When** nadle is invoked without `--config`, **Then** nadle uses the correct file based on its priority rules (`.js` over `.ts`).
3. **Given** a builder that generates a fixture in a temporary directory, **When** the test runs, **Then** the `nadle` module import resolves correctly via the generated `node_modules/nadle` symlink.

---

### Edge Cases

- What happens when the builder generates config content with special characters in task names (e.g., colons, dashes)?
- What happens when the builder produces a fixture in a temp directory and pnpm module resolution is needed?
- How does the builder handle empty config files (no configure, no tasks)?
- What happens when two tests generate fixtures concurrently with the same builder definition — are the temp directories properly isolated?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The builder MUST produce `fixturify.DirJSON` objects compatible with the existing `withFixture` and `fixturify.writeSync` APIs
- **FR-002**: The builder MUST provide a chainable (fluent) API for constructing fixture directory structures
- **FR-003**: The builder MUST generate valid `package.json` files with configurable `name`, `type` (module/commonjs), and `nadle.root` marker
- **FR-004**: The builder MUST generate nadle config file content that nadle can load and execute via jiti
- **FR-005**: The builder MUST support named config file variants (e.g., `nadle.max-number.ts`, `nadle.colon.ts`) for use with `createExec({ config: "variant-name" })`
- **FR-006**: The builder MUST support `configure()` calls with arbitrary option objects
- **FR-007**: The builder MUST support `tasks.register()` calls with optional action function bodies and optional `.config()` chains
- **FR-008**: The builder MUST support different config file extensions (`.ts`, `.js`, `.mts`)
- **FR-009**: The builder MUST support adding arbitrary files and directories to the fixture structure
- **FR-010**: A helper function MUST exist that writes generated fixtures to isolated temp directories with proper `node_modules/nadle` symlinks, enabling nadle to resolve imports
- **FR-011**: The helper function MUST clean up temp directories on test success and preserve them on test failure (matching existing `withFixture` behavior)
- **FR-012**: The builder MUST coexist with the existing `createNadleConfig` function — it is an addition, not a replacement
- **FR-013**: Each migrated test file MUST maintain the same assertions and test coverage as before migration
- **FR-014**: Fixtures used by multiple test files MUST NOT be migrated (to avoid duplication of builder definitions)

### Key Entities

- **FixtureBuilder**: Assembles a directory structure (`fixturify.DirJSON`) with package.json, config files, and arbitrary files via a chainable API
- **ConfigBuilder**: Generates nadle config file content as a string, supporting `configure()` calls and `tasks.register()` statements
- **Generated Fixture**: The output `DirJSON` object, written to a temp directory with module resolution symlinks for test execution

## Assumptions

- The `node_modules/nadle` symlink target is always relative (`../../../..`) and works at the standard fixture depth under `test/__temp__/<hash>/`
- Tests using `expectPass`/snapshot matching will need snapshot updates when fixture paths change from `__fixtures__/` to `__temp__/`
- The builder does not need to support complex imports beyond `nadle` (e.g., `glob`, `node:fs`) — fixtures needing those remain as committed files
- The existing `createNadleConfig` (ts-morph based) remains for workspace tests that already use it

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: At least 3 committed fixture directories are fully replaced by programmatic builder calls and deleted from the repository
- **SC-002**: 100% of existing test assertions in migrated test files continue to pass after migration
- **SC-003**: The total number of committed fixture files decreases by at least 15 files
- **SC-004**: Test authors can define a new simple fixture (configure + register) in 5 lines or fewer using the builder API
- **SC-005**: No fixtures shared across multiple test files are migrated (preventing builder definition duplication)
