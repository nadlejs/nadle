# Implementation Plan: Nadle LSP

**Branch**: `001-nadle-lsp` | **Date**: 2026-02-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-nadle-lsp/spec.md`

## Summary

Build a Language Server Protocol (LSP) server for `nadle.config.ts` files that provides Nadle-specific semantic analysis beyond what TypeScript offers: task name validation, duplicate detection, dependency reference validation, task name completion in `dependsOn`, hover documentation, and go-to-definition. The server uses `vscode-languageserver` for LSP transport and the TypeScript Compiler API (`ts.createSourceFile`) for fast, parser-only AST analysis. Distributed as a new `packages/nadle-lsp` package in the existing monorepo.

## Technical Context

**Language/Version**: TypeScript 5.9.x, targeting Node.js 22+
**Primary Dependencies**: `vscode-languageserver` (v9.x), `vscode-languageserver-textdocument`, `typescript` (for AST parsing only)
**Storage**: N/A (in-memory document analysis cache, no persistence)
**Testing**: vitest (unit tests for analyzer, integration tests via LSP protocol client)
**Target Platform**: Linux, macOS, Windows (cross-platform, editor-agnostic via LSP stdio)
**Project Type**: Single package in existing pnpm monorepo
**Performance Goals**: <100ms completion response, <200ms diagnostic update after debounce, for files with up to 100 task registrations
**Constraints**: ESM only, max 200 lines/file, max 50 lines/function, max complexity 10, max 3 params (per constitution)
**Scale/Scope**: Single-file analysis only. Typical config file: 10-50 task registrations, <500 lines.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Status | Notes                                                                                    |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| I. Code Over Configuration            | PASS   | The LSP analyzes TypeScript code. No new config files introduced.                        |
| II. Type Safety First                 | PASS   | All LSP source in TypeScript strict mode. Public API types exported.                     |
| III. Lightweight and Focused          | PASS   | Separate package — does not affect core 140 KB budget. Minimal dependencies (3 runtime). |
| IV. Integration-First Testing         | PASS   | Integration tests via LSP protocol messages. Unit tests for isolated analyzer logic.     |
| V. Self-Hosting (Dogfooding)          | PASS   | The LSP can analyze Nadle's own `nadle.config.ts` at the repo root.                      |
| VI. Modern ESM and Strict Conventions | PASS   | ESM only, node22 target, PascalCase node imports, no `process.cwd()`.                    |
| VII. Cross-Platform Correctness       | PASS   | LSP uses stdio (platform-agnostic). CI runs on Ubuntu, macOS, Windows.                   |

**Post-Phase 1 re-check**: All gates still PASS. The design introduces no new config formats, stays within file limits, and uses LSP protocol (inherently cross-platform).

## Project Structure

### Documentation (this feature)

```text
specs/001-nadle-lsp/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: development guide
├── contracts/           # Phase 1: LSP capability contracts
│   └── lsp-capabilities.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/nadle-lsp/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsup.config.ts
├── vitest.config.ts
├── src/
│   ├── index.ts              # Public API: re-exports analyzer for reuse
│   ├── server.ts             # LSP entry: createConnection, capabilities, lifecycle
│   ├── analyzer.ts           # AST parsing: find tasks.register(), extract config
│   ├── diagnostics.ts        # Validation: name pattern, duplicates, unresolved deps
│   ├── completions.ts        # Completion provider: task names in dependsOn
│   ├── hover.ts              # Hover provider: task summary tooltips
│   ├── definitions.ts        # Definition provider: go-to-definition for deps
│   └── document-store.ts     # Cached DocumentAnalysis per open file
├── test/
│   ├── __fixtures__/         # Sample nadle.config.ts files
│   │   ├── valid.ts          # Valid config with multiple tasks
│   │   ├── invalid-names.ts  # Invalid task names
│   │   ├── duplicates.ts     # Duplicate task registrations
│   │   ├── unresolved-deps.ts # Broken dependsOn references
│   │   └── dynamic-names.ts  # Non-literal task names (should be skipped)
│   ├── analyzer.test.ts      # Unit tests for AST analysis
│   ├── diagnostics.test.ts   # Unit tests for validation logic
│   └── server.test.ts        # Integration tests via LSP protocol
└── lib/                      # Build output (generated)
```

**Structure Decision**: Single package (`packages/nadle-lsp`) following the existing monorepo pattern. The analyzer is separated from the LSP transport layer so it can be tested independently and potentially reused by a future `nadle --validate-config` CLI command. Each LSP feature (completions, hover, definitions, diagnostics) is its own file to stay within the 200-line limit.

## Implementation Phases

### Phase 1: Package Scaffolding & Analyzer Core

Set up the `packages/nadle-lsp` package with build tooling (tsup, vitest, tsconfig) mirroring the existing `packages/create-nadle` pattern. Implement the core `analyzer.ts` that parses a config file string using `ts.createSourceFile()` and extracts `TaskRegistration[]` with name, range, form, and config info. Add unit tests with fixture files.

**Files**: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `tsup.config.ts`, `vitest.config.ts`, `src/index.ts`, `src/analyzer.ts`, `src/document-store.ts`, `test/__fixtures__/*`, `test/analyzer.test.ts`

### Phase 2: Diagnostics (P1 features)

Implement `diagnostics.ts` with three diagnostic rules: invalid task name (regex), duplicate task name, unresolved dependency reference. Wire into the document store so diagnostics are recomputed on every analysis. Add unit tests.

**Files**: `src/diagnostics.ts`, `test/diagnostics.test.ts`

### Phase 3: LSP Server & Diagnostic Publishing

Implement `server.ts` with `createConnection`, `TextDocuments`, capability declaration, and the `onDidChangeContent` handler that triggers analysis + diagnostic push (debounced 200ms). Add integration tests that spawn the server and send LSP messages.

**Files**: `src/server.ts`, `test/server.test.ts`

### Phase 4: Completions & Hover (P2/P3 features)

Implement `completions.ts` (task name suggestions in `dependsOn` strings) and `hover.ts` (task summary on hover). Wire into the server's `onCompletion` and `onHover` handlers. Add tests.

**Files**: `src/completions.ts`, `src/hover.ts`, tests

### Phase 5: Go-to-Definition & Polish (P3 features)

Implement `definitions.ts` (navigate from `dependsOn` string to `tasks.register()` call). Wire into `onDefinition`. Final integration tests, CI setup, and documentation.

**Files**: `src/definitions.ts`, CI workflow updates, README

## Complexity Tracking

No constitution violations to justify. All design decisions align with existing principles and constraints.
