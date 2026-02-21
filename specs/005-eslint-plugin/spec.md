# Feature Specification: ESLint Plugin for Nadle

**Feature Branch**: `005-eslint-plugin`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "Move eslint-plugin-nadle into monorepo and enhance with ESM, rules, and tests"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Catch Common Config Mistakes (Priority: P1)

A developer writing a `nadle.config.ts` file makes common mistakes — registering tasks without descriptions, using duplicate names, or accidentally creating circular dependencies. The ESLint plugin catches these issues in their editor before they ever run `nadle`, providing immediate feedback with clear error messages and fix suggestions.

**Why this priority**: This is the core value proposition — catching configuration errors at authoring time rather than runtime. Without rules, the plugin has no purpose.

**Independent Test**: Can be fully tested by creating a nadle config file with known issues (duplicate names, missing descriptions, circular deps) and verifying ESLint reports the expected diagnostics.

**Acceptance Scenarios**:

1. **Given** a nadle config with two tasks registered with the same name, **When** ESLint runs, **Then** the `no-duplicate-task-names` rule reports an error on the second registration
2. **Given** a nadle config where task A depends on task B and task B depends on task A, **When** ESLint runs, **Then** the `no-circular-dependencies` rule reports an error identifying the cycle
3. **Given** a nadle config with a task registered without a description, **When** ESLint runs with `recommended` config, **Then** the `require-task-description` rule reports a warning
4. **Given** a nadle config with a task registered without a name argument, **When** ESLint runs, **Then** the `no-anonymous-tasks` rule reports an error
5. **Given** a nadle config with a task name like `"Build-All!"`, **When** ESLint runs, **Then** the `valid-task-name` rule reports an error explaining the naming pattern
6. **Given** a nadle config where `dependsOn` is set to a number instead of a string, **When** ESLint runs, **Then** the `valid-depends-on` rule reports an error
7. **Given** a nadle config with a task that declares `outputs` but no `inputs`, **When** ESLint runs, **Then** the `require-task-inputs` rule reports a warning

---

### User Story 2 - One-Line Plugin Setup (Priority: P2)

A developer adds `eslint-plugin-nadle` to their project and enables the `recommended` config in their ESLint flat config with a single spread. All sensible default rules are enabled at appropriate severity levels without further configuration.

**Why this priority**: Easy adoption is critical for the plugin to be used. If setup is complex, developers won't bother.

**Independent Test**: Can be fully tested by installing the plugin, adding the recommended config to an ESLint flat config, and verifying rules activate without additional configuration.

**Acceptance Scenarios**:

1. **Given** a project with ESLint 9+ flat config, **When** the developer adds `...nadle.configs.recommended` to their config array, **Then** all recommended rules are active with appropriate severity
2. **Given** a project using the `all` config, **When** the developer adds `...nadle.configs.all`, **Then** all non-deprecated rules are active at error level
3. **Given** a developer who wants custom rule configuration, **When** they override individual rules after spreading the config, **Then** their overrides take effect

---

### User Story 3 - Enforce Best Practices in Task Actions (Priority: P3)

A developer writes a task action that uses synchronous filesystem or child_process calls (`fs.readFileSync`, `execSync`), which blocks the worker thread and degrades parallel execution performance. The plugin warns them to use async alternatives.

**Why this priority**: Performance best practices are valuable but less critical than correctness rules. Developers can still use the tool effectively with sync calls; they just lose some parallelism benefit.

**Independent Test**: Can be tested by writing task actions with sync calls and verifying the rule reports warnings.

**Acceptance Scenarios**:

1. **Given** a task action calling `fs.readFileSync()`, **When** ESLint runs, **Then** `no-sync-in-task-action` reports a warning suggesting the async alternative
2. **Given** a task action calling `child_process.execSync()`, **When** ESLint runs, **Then** `no-sync-in-task-action` reports a warning
3. **Given** a task action using only async APIs, **When** ESLint runs, **Then** no warnings are reported
4. **Given** a task action using `process.cwd()`, **When** ESLint runs, **Then** `no-process-cwd` reports a warning suggesting `context.workingDir` instead

---

### User Story 4 - Suggest Built-in Tasks (Priority: P4)

A developer writes a custom task that shells out to run a command (e.g., using `execa` directly), when they could use the built-in `ExecTask`. The plugin suggests using the built-in task type for better integration with Nadle's features (caching, reporting).

**Why this priority**: This is a "nice to have" suggestion rule. It improves code quality but doesn't prevent errors.

**Independent Test**: Can be tested by writing task actions that match built-in task patterns and verifying the rule suggests alternatives.

**Acceptance Scenarios**:

1. **Given** a task action that spawns a process via `execa` or `child_process.exec`, **When** ESLint runs, **Then** `prefer-builtin-task` suggests using `ExecTask` instead
2. **Given** a task action that calls `pnpm` via `execa`, **When** ESLint runs, **Then** the rule suggests using `PnpmTask`
3. **Given** a task using `ExecTask`, **When** ESLint runs, **Then** no suggestion is reported

---

### Edge Cases

- What happens when `tasks.register()` is called with a variable (not a string literal) as the name? Rules requiring name analysis should skip dynamic names without reporting false positives.
- What happens when `dependsOn` references are dynamic expressions? The circular dependency rule should skip non-literal dependency arrays.
- What happens when a config file re-exports task registrations from another module? Rules only analyze the current file scope.
- How does the plugin handle monorepo setups where tasks span multiple config files? Each file is analyzed independently; cross-file analysis is out of scope for this version.

## Clarifications

### Session 2026-02-21

- Q: Should the `recommended` config automatically scope rules to `nadle.config.*` files only? → A: Yes, both `recommended` and `all` configs include `files: ["nadle.config.*"]` to eliminate false positives by default.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Plugin MUST be an ESM module compatible with ESLint 9+ flat config
- **FR-002**: Plugin MUST export a `configs.recommended` preset with sensible defaults (warnings for style rules, errors for correctness rules), scoped to `nadle.config.*` files
- **FR-003**: Plugin MUST export a `configs.all` preset with all non-deprecated rules at error level, scoped to `nadle.config.*` files
- **FR-004**: Plugin MUST provide a `no-anonymous-tasks` rule that flags `tasks.register()` calls without a string literal name
- **FR-005**: Plugin MUST provide a `no-duplicate-task-names` rule that detects duplicate string literal names in `tasks.register()` calls within the same file
- **FR-006**: Plugin MUST provide a `no-circular-dependencies` rule that detects cycles in `dependsOn` references using string literal analysis within a single file
- **FR-007**: Plugin MUST provide a `require-task-description` rule that flags tasks without a `description` in their `.config()` call
- **FR-008**: Plugin MUST provide a `no-sync-in-task-action` rule that flags synchronous `fs` and `child_process` calls within task action functions
- **FR-009**: Plugin MUST provide a `prefer-builtin-task` rule that suggests built-in task types when custom task actions match known patterns (process spawning, file copying, file deletion)
- **FR-010**: Plugin MUST provide a `valid-task-name` rule that flags task names not matching the pattern `^[a-z]([a-z0-9-]*[a-z0-9])?$`
- **FR-011**: Plugin MUST provide a `no-process-cwd` rule that flags `process.cwd()` calls within task actions and suggests using `context.workingDir` instead
- **FR-012**: Plugin MUST provide a `require-task-inputs` rule that warns when a task declares `outputs` in `.config()` but no corresponding `inputs`
- **FR-013**: Plugin MUST provide a `valid-depends-on` rule that flags `dependsOn` values that are not strings or arrays of strings
- **FR-014**: Plugin MUST provide a `padding-between-tasks` rule that enforces an empty line between consecutive `tasks.register()` call statements, with autofix support
- **FR-015**: All rules MUST provide clear error messages that include the rule name, what's wrong, and how to fix it
- **FR-016**: Plugin MUST be buildable with tsc and follow monorepo conventions (ESM, node>=22, proper exports)
- **FR-017**: Plugin MUST be added to the release-please configuration for automated version management
- **FR-018**: All rules MUST have tests using vitest and @typescript-eslint/rule-tester
- **FR-019**: Rules that perform static analysis on string literals MUST gracefully skip dynamic expressions without false positives

### Key Entities

- **Rule**: An ESLint rule module with meta (docs, messages, schema) and a create function that returns AST visitors
- **Config Preset**: A flat config object with plugin reference, rules map, and optional language options
- **Task Registration**: A `tasks.register()` call site in a nadle config file, the primary AST pattern rules analyze

## Documentation Impact

- **Docs pages to create**: New guide in `docs/guides/eslint-plugin.md` covering installation, configuration, and rule reference
- **Docs pages to update**: `docs/getting-started/` to mention ESLint plugin as an optional tooling addition
- **Sidebar update needed**: Yes — add ESLint plugin guide to sidebar

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All 11 rules pass their test suites with both valid and invalid code cases
- **SC-002**: Plugin installs and activates in under 5 seconds with zero configuration beyond importing the recommended config
- **SC-003**: Zero false positives on standard nadle config files (tested against the monorepo's own config files and sample-app)
- **SC-004**: 100% of rules have at least 3 valid and 3 invalid test cases each
- **SC-005**: Plugin bundle size stays under 50 KB

## Assumptions

- Rules only analyze a single file at a time; cross-file analysis (e.g., cross-workspace duplicate detection) is out of scope for this initial version
- The plugin targets ESLint 9+ flat config only; legacy `.eslintrc` config is not supported
- Task name analysis relies on string literals; dynamic names computed at runtime cannot be statically analyzed
- The `no-circular-dependencies` rule detects cycles within a single config file's `dependsOn` declarations only
- The `prefer-builtin-task` rule uses heuristic pattern matching (e.g., detecting `execa` calls) and may not catch all cases
