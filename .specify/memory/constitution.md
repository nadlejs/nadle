<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0 (initial ratification)
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (7 principles)
  - Technical Constraints
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ compatible (Constitution Check
    section aligns with declared principles)
  - .specify/templates/spec-template.md — ✅ compatible (no constitution-
    specific sections required)
  - .specify/templates/tasks-template.md — ✅ compatible (phase structure
    accommodates testing and cross-platform concerns)
Follow-up TODOs: None
-->

# Nadle Constitution

## Core Principles

### I. Code Over Configuration

Every build definition MUST be written as TypeScript code in
`nadle.config.ts`. Configuration files (JSON, YAML, TOML) MUST NOT be
used to express build logic. Task definitions, dependencies, and
conditional logic MUST leverage the full TypeScript language — imports,
conditionals, loops, type inference — rather than declarative schemas.

**Rationale**: Nadle's core differentiator is that build logic is real
TypeScript, not a DSL. This enables sharing task definitions as npm
packages, compile-time validation, and full IDE support.

### II. Type Safety First

All public APIs MUST use TypeScript strict mode. Task contracts MUST be
defined via `defineTask<Options>()` to provide compile-time validation
of task inputs. The public API surface MUST be tracked by
`@microsoft/api-extractor` and recorded in `index.api.md`. Breaking
changes to the API surface MUST follow semver.

**Rationale**: Type-safe task contracts are a unique advantage over
every other JS build tool. Weakening type safety erodes the primary
value proposition.

### III. Lightweight and Focused

The total bundle size MUST NOT exceed 140 KB (tracked by `size-limit`).
New dependencies MUST be justified against the size budget. Features
MUST NOT be added speculatively — YAGNI applies. The API surface MUST
remain minimal: prefer fewer, composable primitives over many
specialized helpers.

**Rationale**: Nadle targets developers who rejected enterprise-weight
tools. Every kilobyte and every API method is a commitment. Install
time and cognitive load MUST stay low.

### IV. Integration-First Testing

Tests MUST primarily be integration tests that spawn the CLI via
`execa` and assert on stdout using custom matchers (`toRunInOrder`,
`toDoneInOrder`, `toSettle`, `toRun`). Unit tests are permitted for
isolated logic but MUST NOT be the primary testing strategy. Test
fixtures MUST live in `test/__fixtures__/` and temporary directories
in `__temp__/`. Type-level tests MUST use `*.test-d.ts` files.

**Rationale**: Integration tests verify the tool as users experience
it — through the CLI. This catches regressions that unit tests miss
(argument parsing, worker thread communication, output formatting).

### V. Self-Hosting (Dogfooding)

Nadle MUST build itself. The root `nadle.config.ts` MUST define the
project's own build pipeline. Any feature that breaks self-hosting
MUST be fixed before release. The CI pipeline MUST use
`npx nadle check build test --summary` as the primary build command.

**Rationale**: Self-hosting is the strongest signal that the tool
works. It surfaces real-world issues immediately and demonstrates
confidence to users evaluating adoption.

### VI. Modern ESM and Strict Conventions

All source code MUST be ESM only, targeting `node22`. Node built-in
imports MUST use PascalCase default imports only
(`import Path from "node:path"`) — no named or namespace imports from
`node:` modules (enforced by eslint). `process.cwd()` MUST NOT appear
in core source — use `projectDir` / `workingDir` context instead
(enforced by eslint). Direct `consola` imports MUST NOT be used — the
`logger` abstraction MUST be used instead.

**Rationale**: Consistent, strict conventions prevent subtle bugs
(CWD assumptions in worker threads), enable tooling enforcement, and
keep the codebase readable for contributors.

### VII. Cross-Platform Correctness

All features MUST work on Ubuntu, macOS, and Windows. CI MUST run on
all three platforms with Node 22 and 24. Path handling MUST use
`node:path` abstractions, never hardcoded separators. Caching MUST
produce correct results on all platforms.

**Rationale**: A build tool that only works on one OS is not a
real build tool. Cross-platform correctness is table stakes for
adoption in diverse teams.

## Technical Constraints

- **Source file limits**: Maximum 200 lines per file, maximum
  50 lines per function, maximum cyclomatic complexity of 10,
  maximum 3 parameters per function.
- **Build tooling**: `tsup` with 3 entry points (cli, index, worker).
- **Config loading**: `jiti` transpiles `nadle.config.ts` at runtime.
- **Worker execution**: `tinypool` for parallel task execution in
  worker threads.
- **Monorepo management**: pnpm workspaces. No other package
  managers are supported for development.
- **Release process**: `release-please` for automated changelog
  and version bumps. Semver MUST be followed strictly.

## Development Workflow

- **Build**: `pnpm -F nadle build:tsup` or `npx nadle build`
  (self-hosted).
- **Test**: `pnpm -F nadle test` runs all tests via vitest with
  thread pool, 20s timeout. Retries: 5 on CI, 2 locally.
- **Full pipeline**: `npx nadle check build test --summary`
  (the canonical CI command).
- **API tracking**: After any public API change, `api-extractor`
  MUST be run and `index.api.md` MUST be updated.
- **Bundle size check**: `size-limit` MUST pass before release.
  The 140 KB limit is enforced in `package.json`.
- **Code review**: All PRs MUST verify compliance with this
  constitution's principles before merge.

## Governance

This constitution is the authoritative source of project principles
and constraints. It supersedes informal conventions found elsewhere.

**Amendments**: Any change to this constitution MUST be documented
with a version bump, rationale, and migration plan if the change
affects existing code or workflows. Amendments follow semantic
versioning:
- MAJOR: Principle removal, redefinition, or backward-incompatible
  governance change.
- MINOR: New principle or section added, or material expansion of
  existing guidance.
- PATCH: Clarifications, wording fixes, non-semantic refinements.

**Compliance**: All feature specifications, implementation plans,
and task lists produced by speckit commands MUST be validated against
this constitution. The "Constitution Check" section in plan-template
MUST reference these principles.

**Runtime guidance**: The project-level `CLAUDE.md` file contains
operational development instructions and MUST remain consistent with
this constitution. If a conflict arises, this constitution prevails.

**Version**: 1.0.0 | **Ratified**: 2026-02-14 | **Last Amended**: 2026-02-14
