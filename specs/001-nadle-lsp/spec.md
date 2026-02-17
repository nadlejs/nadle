# Feature Specification: Nadle LSP

**Feature Branch**: `001-nadle-lsp`
**Created**: 2026-02-17
**Status**: Draft
**Input**: User description: "Nadle LSP - Language Server Protocol implementation for nadle.config.ts files"

## Clarifications

### Session 2026-02-17

- Q: When should the LSP update diagnostics — on every change, on save, or on open+save? → A: On-change (re-analyze after every edit, with debounce).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Task Name Validation (Priority: P1)

A developer writes a `nadle.config.ts` file and registers tasks with invalid names. The editor shows real-time diagnostic errors highlighting the invalid names with an explanation of the naming rules, without requiring the developer to run the CLI and read the error output.

**Why this priority**: Invalid task names are the most common config mistake and cause cryptic runtime errors. Catching them at edit time eliminates the entire run-fail-fix cycle for the most basic issue.

**Independent Test**: Can be fully tested by opening a `nadle.config.ts` with invalid task names (uppercase, hyphens at end, special characters) and verifying red squiggles appear with descriptive messages.

**Acceptance Scenarios**:

1. **Given** a `nadle.config.ts` with `tasks.register("My-Task", ...)`, **When** the file is opened in an editor with the LSP active, **Then** a diagnostic error appears on `"My-Task"` stating that task names must match `^[a-z]([a-z0-9-]*[a-z0-9])?$`.
2. **Given** a `nadle.config.ts` with `tasks.register("build", ...)`, **When** the file is opened, **Then** no diagnostic is shown for the task name.
3. **Given** a `nadle.config.ts` with `tasks.register("build-", ...)`, **When** the file is opened, **Then** a diagnostic error appears stating task names must not end with a hyphen.

---

### User Story 2 - Duplicate Task Detection (Priority: P1)

A developer registers two tasks with the same name in the same config file. The editor highlights the duplicate registration as an error immediately, rather than letting them discover it only when running `nadle`.

**Why this priority**: Duplicate task names silently overwrite each other or cause runtime errors. This is a correctness issue that TypeScript's type system cannot catch since task names are string literals passed to function calls.

**Independent Test**: Can be tested by registering two tasks with the same name in a single file and verifying the second registration is flagged.

**Acceptance Scenarios**:

1. **Given** a `nadle.config.ts` with two `tasks.register("build", ...)` calls, **When** the second registration is typed, **Then** a diagnostic error appears on it indicating a duplicate task name.
2. **Given** a `nadle.config.ts` where a previously duplicated task name is renamed, **When** the edit is applied, **Then** the duplicate diagnostic is removed.

---

### User Story 3 - Dependency Reference Validation (Priority: P2)

A developer sets `dependsOn: ["complie"]` (typo) in a task configuration. The editor shows a warning that `"complie"` does not match any registered task in the same file, helping catch typos before running the build. <!-- cspell:ignore complie -->

**Why this priority**: Invalid dependency references cause runtime failures that are hard to debug in complex task graphs. Since dependencies are plain strings, TypeScript provides no validation. This is the second most common config error after naming issues.

**Independent Test**: Can be tested by adding a `dependsOn` reference to a non-existent task and verifying a warning appears.

**Acceptance Scenarios**:

1. **Given** a config with tasks `"build"` and `"test"`, and `"test"` has `dependsOn: ["buld"]`, **When** the dependency string is typed, **Then** a warning appears on `"buld"` stating no task with that name is registered. <!-- cspell:ignore buld -->
2. **Given** a config where the referenced task exists, **When** the file is edited, **Then** no warning appears for that dependency.
3. **Given** a config with a workspace-qualified dependency like `"packages:foo:build"`, **When** the file is edited, **Then** no warning is shown (cross-file references cannot be validated within a single file).

---

### User Story 4 - Task Name Completion in dependsOn (Priority: P2)

A developer types `dependsOn: ["` inside a `.config()` call and the editor suggests all task names registered in the current file. This eliminates typos and speeds up wiring task dependencies.

**Why this priority**: Autocompletion for task names is the highest-impact productivity feature. It directly prevents the errors caught by dependency validation (P2) and is the most-requested feature for config-as-code build tools.

**Independent Test**: Can be tested by triggering autocompletion inside a `dependsOn` array and verifying all registered task names from the file appear as suggestions.

**Acceptance Scenarios**:

1. **Given** a config file with tasks `"lint"`, `"compile"`, and `"test"` registered, **When** the developer triggers completion inside `dependsOn: ["`, **Then** all three task names appear as completion items.
2. **Given** the developer has already typed `dependsOn: ["li`, **When** completion is triggered, **Then** `"lint"` appears as a filtered suggestion.
3. **Given** the task being configured is `"build"`, **When** completion is triggered in its own `dependsOn`, **Then** `"build"` is excluded from suggestions (a task cannot depend on itself).

---

### User Story 5 - Hover Documentation (Priority: P3)

A developer hovers over a task name string in a `dependsOn` array or over a `tasks.register(...)` call, and the editor shows a tooltip with the task's configuration summary (dependencies, group, description, inputs/outputs if set).

**Why this priority**: Hover information provides quick navigation context in complex config files without requiring the developer to scroll to the task definition. It is a polish feature that enhances the editing experience but is not blocking.

**Independent Test**: Can be tested by hovering over a task name reference and verifying a tooltip appears with the task's configuration.

**Acceptance Scenarios**:

1. **Given** a config with `tasks.register("build", ExecTask, ...).config({ description: "Compile TypeScript", dependsOn: ["lint"] })`, **When** the developer hovers over `"build"` in another task's `dependsOn`, **Then** a tooltip appears showing the description, dependencies, and task type.
2. **Given** a task with no description or configuration, **When** hovering over its name, **Then** a minimal tooltip appears showing just the task name and registration type (function, typed, or no-op).

---

### User Story 6 - Go-to-Definition for Task References (Priority: P3)

A developer Ctrl+clicks (or Cmd+clicks) a task name inside a `dependsOn` array and the editor navigates to the corresponding `tasks.register(...)` call in the same file.

**Why this priority**: Navigation between task definitions and their references is essential for large config files with many tasks. This complements hover (P3) as a navigation feature.

**Independent Test**: Can be tested by Ctrl+clicking a task name in `dependsOn` and verifying the cursor moves to the matching `tasks.register(...)` call.

**Acceptance Scenarios**:

1. **Given** a config with `tasks.register("build", ...)` on line 10 and `dependsOn: ["build"]` on line 25, **When** the developer Ctrl+clicks `"build"` on line 25, **Then** the editor navigates to line 10.
2. **Given** a `dependsOn` reference to a task not defined in the current file (e.g., a workspace-qualified name), **When** the developer Ctrl+clicks it, **Then** no navigation occurs (graceful no-op).

---

### Edge Cases

- What happens when the config file has syntax errors that prevent parsing? The LSP should degrade gracefully and show only parse-level diagnostics without crashing.
- How does the LSP handle config files that import and re-export tasks from other modules? Only tasks registered via `tasks.register()` calls visible in the current file are analyzed; imported registrations from other modules are not followed.
- What happens when `tasks.register()` is called with a computed or dynamic task name (e.g., a variable, template literal, or function return value)? The LSP should skip validation for non-literal string arguments and not produce false positives.
- How does the LSP handle workspace config files (child `nadle.config.ts` in sub-packages)? Each config file is analyzed independently; cross-file task references are not validated.
- What happens when the LSP encounters a config file format other than `.ts` (e.g., `.js`, `.mjs`, `.mts`)? The LSP should support all four config file formats that Nadle supports.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The LSP MUST validate task names in `tasks.register()` calls against the pattern `^[a-z]([a-z0-9-]*[a-z0-9])?$` and report diagnostics for invalid names.
- **FR-002**: The LSP MUST detect duplicate task names within the same config file and report a diagnostic on the second (and subsequent) registrations.
- **FR-003**: The LSP MUST validate `dependsOn` string references against task names registered in the same file and report warnings for unresolved references.
- **FR-004**: The LSP MUST NOT report warnings for workspace-qualified dependency references (containing `:`) since those reference tasks in other files.
- **FR-005**: The LSP MUST provide completion items for task names when the cursor is inside a `dependsOn` string literal or array.
- **FR-006**: The LSP MUST exclude the current task's own name from `dependsOn` completion suggestions.
- **FR-007**: The LSP MUST provide hover information for task name strings, showing the task's description, dependencies, type (no-op, function, typed), and configuration summary.
- **FR-008**: The LSP MUST support go-to-definition from task name strings in `dependsOn` to the corresponding `tasks.register()` call location.
- **FR-009**: The LSP MUST skip validation for `tasks.register()` calls where the task name argument is not a string literal (variables, template literals, function calls).
- **FR-010**: The LSP MUST support all four Nadle config file formats: `.ts`, `.js`, `.mjs`, `.mts`.
- **FR-011**: The LSP MUST degrade gracefully when the config file contains syntax errors, providing parse-level diagnostics without crashing.
- **FR-012**: The LSP MUST analyze each config file independently without requiring cross-file resolution.
- **FR-013**: The LSP MUST work on all three target platforms: Linux, macOS, and Windows.
- **FR-014**: The LSP MUST re-analyze the config file on every text change (with debounce) and update diagnostics without requiring a manual save.

### Non-Functional Requirements

- **NFR-001**: The LSP MUST respond to completion requests within a timeframe that feels instant to the developer (industry standard: under 100ms for most files).
- **NFR-002**: The LSP MUST not block the editor's main thread or cause perceptible UI lag during file editing.
- **NFR-003**: The LSP MUST follow the Language Server Protocol specification to ensure compatibility with any LSP-capable editor (VS Code, Neovim, Zed, Helix, etc.).

### Key Entities

- **Task Registration**: A `tasks.register()` call site in the config file, with its task name, registration form (no-op, function, typed), and source location.
- **Task Configuration**: The `.config()` call chain attached to a registration, containing `dependsOn`, `description`, `group`, `inputs`, `outputs`, `env`, and `workingDir`.
- **Dependency Reference**: A string literal inside a `dependsOn` array or value that references another task by name.

### Assumptions

- TypeScript's built-in language service already handles type-checking, import resolution, and general autocompletion for the config file. The Nadle LSP focuses exclusively on Nadle-specific semantic analysis that TypeScript cannot provide (task name validation, dependency resolution, task-aware completions).
- The LSP is distributed as a separate package (`nadle-lsp`) and does not increase the core `nadle` package bundle size.
- A minimal VS Code extension (`nadle-vscode`) wraps the LSP as a thin client using stdio transport. It preserves TypeScript's built-in syntax highlighting by using pattern-based document selectors rather than registering a custom language ID.

### Documentation Impact

- **Created**: `packages/docs/docs/getting-started/features/editor-support.md` — documents LSP capabilities and editor setup.
- **Updated**: `packages/docs/sidebars.ts` — added the new page to the Features category.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Developers see diagnostic feedback for invalid task names within 1 second of typing in config files with up to 100 task registrations.
- **SC-002**: 100% of task name validation rules from the Nadle specification are enforced by the LSP (regex pattern, no duplicates).
- **SC-003**: Dependency completion suggestions appear for all string-literal task names registered in the current file, with zero false suggestions (no self-references, no duplicates in the list).
- **SC-004**: The LSP produces zero false-positive diagnostics for valid config files (non-literal task names, workspace-qualified dependencies, and all four file formats).
- **SC-005**: The LSP runs correctly on Linux, macOS, and Windows without platform-specific workarounds required by the user.
