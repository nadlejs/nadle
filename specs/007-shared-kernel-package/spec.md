# Feature Specification: Shared Kernel Package (`@nadle/kernel`)

**Feature Branch**: `007-shared-kernel-package`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Extract shared workspace resolution, task identifier parsing, and alias mapping logic into a new shared package for reuse by the language server and ESLint plugin."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Extract and Test Shared Resolution Logic (Priority: P1)

A new shared package (`@nadle/kernel`) is created containing task identifier parsing, workspace ID derivation, alias resolution, and fallback resolution logic. The package is independently testable with spec-derived tests, enabling future consumers (language server, ESLint plugin) to import it without duplicating nadle core internals.

**Why this priority**: The shared package must exist and be correct before any consumer can use it. This is the foundational deliverable.

**Independent Test**: Can be tested by calling the shared resolution functions directly and verifying behavior matches the nadle specification (e.g., parsing `"shared:build"` returns workspace `"shared"` and task `"build"`).

**Acceptance Scenarios**:

1. **Given** the shared package is created, **When** it parses the reference `"shared:build"`, **Then** it returns workspace input `"shared"` and task name `"build"`.
2. **Given** a workspace alias mapping `"packages/shared"` to `"shared"`, **When** the shared package resolves the workspace input `"shared"` against known workspaces, **Then** it maps to the workspace with relative path `packages/shared`.
3. **Given** a reference `"build"` without a workspace qualifier, **When** the shared package resolves it in the context of workspace `frontend`, **Then** it looks in `frontend` first, falling back to `root` if not found.

---

### User Story 2 - Nadle Core Uses Shared Logic Instead of Inlined Implementation (Priority: P1)

The nadle core package (`packages/nadle`) replaces its existing `TaskIdentifier.parser()`, workspace ID derivation, and alias resolution logic with imports from the shared kernel package. All existing behavior is preserved — no user-facing changes.

**Why this priority**: Equal priority to Story 1 because extraction must happen before the LSP can consume the shared logic. This is the refactoring step that creates the shared package.

**Independent Test**: Can be tested by running the full nadle test suite after replacing internal implementations with shared package imports. All existing tests must pass without modification.

**Acceptance Scenarios**:

1. **Given** nadle core depends on `@nadle/kernel`, **When** the full test suite runs, **Then** all existing tests pass with no snapshot changes.
2. **Given** `TaskIdentifier.parser()` is moved to the shared package, **When** nadle core imports it from `@nadle/kernel`, **Then** the behavior is identical (same inputs produce same outputs).

---

### Out of Scope (Follow-Up)

The following are motivating use cases for this package but are **not deliverables** of this feature. They will be tracked as separate issues:

- **Language server integration**: Wire `@nadle/kernel` into the LSP to enable cross-workspace go-to-definition, find-references, and hover for workspace-qualified task references.
- **ESLint plugin integration**: Wire `@nadle/kernel` into the ESLint plugin to validate cross-workspace `dependsOn` references.

---

### Edge Cases

- What happens when a task reference contains multiple colons (e.g., `"apps:web:client:build"`)? The last segment is the task name; all preceding segments form the workspace ID (`apps:web:client`).
- What happens when a reference has no colon (e.g., `"build"`)? It resolves within the current workspace, falling back to root.
- What happens when a workspace alias conflicts with another workspace's ID? The alias validation rejects it as a duplicate.
- What happens on Windows where paths use backslashes? Path separators are normalized to forward slashes before deriving workspace IDs.
- What happens when the root workspace is referenced explicitly (e.g., `"root:build"`)? The workspace ID `"root"` maps to the root workspace.

## Clarifications

### Session 2026-02-22

- Q: Should the shared package export only minimal workspace identity fields or the full workspace type? → A: Minimal identity only (`id`, `label`, `relativePath`) — consumers extend as needed.
- Q: Should LSP and ESLint integration be in scope for this feature? → A: No — extract + nadle core consumption only. LSP and ESLint integration are separate follow-up features.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The shared package MUST provide a function to parse a task reference string into its workspace and task name components, following the rules in spec `02-task-configuration.md` (last segment = task name, preceding segments = workspace ID).
- **FR-002**: The shared package MUST provide a function to derive a workspace ID from a relative filesystem path by replacing path separators with colons, following spec `07-workspace.md`.
- **FR-003**: The shared package MUST normalize Windows backslashes to forward slashes before deriving workspace IDs.
- **FR-004**: The shared package MUST provide a function to compose a task identifier from a workspace ID (or label) and a task name.
- **FR-005**: The shared package MUST provide a function to resolve a workspace input (from a task reference) against a list of known workspaces, matching by ID or label.
- **FR-006**: The shared package MUST provide alias resolution — mapping workspace paths to human-readable labels — supporting both object map and function styles.
- **FR-007**: The shared package MUST validate alias uniqueness: no alias may duplicate another workspace's label or ID.
- **FR-008**: The shared package MUST define the root workspace ID constant as `"root"`.
- **FR-009**: The shared package MUST have zero runtime dependencies beyond Node.js built-ins.
- **FR-010**: The nadle core package MUST replace its existing `TaskIdentifier` namespace, workspace ID derivation, and alias resolution with imports from the shared package.
- **FR-011**: The shared package MUST export a minimal workspace identity type containing only `id`, `label`, and `relativePath`. Consumers (nadle core, language server) extend this type with their own additional fields (e.g., `absolutePath`, `configFilePath`, `packageJson`).
- **FR-012**: The shared package MUST provide the fallback resolution rule: when a task is not found in the target workspace, fall back to the root workspace.

### Key Entities

- **Task Reference**: A string like `"build"` or `"shared:build"` that identifies a task, optionally qualified with a workspace prefix.
- **Workspace Identity**: The minimal set of fields needed for resolution: `id`, `label`, and `relativePath`.
- **Task Identifier**: A composed string in the form `workspaceLabel:taskName` (or just `taskName` for root workspace tasks).
- **Alias Map**: A mapping from workspace relative paths to human-readable labels.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All existing nadle core tests pass without modification after the extraction refactor.
- **SC-002**: The shared package has 100% test coverage for all exported functions, with tests derived from the nadle specification.
- **SC-003**: The shared package bundle size is under 5 KB (minified), confirming no heavy dependencies were included.
- **SC-004**: The shared package exports are importable by other packages in the monorepo (language server, ESLint plugin) without pulling in nadle core dependencies.
