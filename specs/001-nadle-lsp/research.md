# Research: Nadle LSP

## Decision 1: LSP Framework

**Decision**: Use `vscode-languageserver` (v9.x or v10.0.0-next)

**Rationale**: Standard, thin, well-documented library used by Tailwind CSS, ESLint, JSON, YAML, and most config-oriented LSPs. Nadle config files are plain TypeScript — no embedded languages — so Volar's virtual document abstraction adds complexity with zero benefit.

**Alternatives considered**:

- `@volar/language-server` — designed for embedded-language files (Vue SFC, Astro). Overkill for single-language `.ts` files. Heavier dependency footprint.
- Rolling a minimal LSP from scratch using `vscode-languageserver-protocol` — re-implements document sync and lifecycle management for no practical advantage.

## Decision 2: AST Parsing Strategy

**Decision**: Use the raw TypeScript Compiler API (`typescript` package) with `ts.createSourceFile()` for parser-only AST analysis. No type checker needed.

**Rationale**: `createSourceFile()` is extremely fast (parser only, no import resolution or type checking). For finding `tasks.register("name")` calls, pure syntactic analysis suffices — we just need to identify `CallExpression` nodes with `PropertyAccessExpression` matching `tasks.register` and extract `StringLiteral` first arguments.

**Alternatives considered**:

- `ts-morph` — wraps every node in rich objects, allocates more memory. Overhead not justified for read-only AST walking in an LSP that re-parses on every keystroke. One additional dependency.
- Full `ts.createProgram()` — resolves imports and checks types. Unnecessary overhead since we only need syntactic analysis of the current file.

## Decision 3: Architecture Pattern

**Decision**: Separate the analysis logic (service layer) from the LSP transport layer.

**Rationale**: This is the pattern used by Tailwind CSS IntelliSense (split into `tailwindcss-language-server` + `tailwindcss-language-service`). Benefits:

- Analysis logic is independently testable without LSP protocol
- Could power a future `nadle --validate-config` CLI command
- Clean separation of concerns

## Decision 4: Package Structure

**Decision**: Single package `packages/nadle-lsp` in the existing monorepo. No separate VS Code extension package yet (out of spec scope).

**Rationale**: Follows existing monorepo pattern (`packages/*`). The LSP server is the VS Code extension's only dependency — the thin client wrapper will be a separate future spec. The server communicates via stdio, making it editor-agnostic.

## Decision 5: Testing Strategy

**Decision**: Integration tests using the `vscode-languageserver-protocol` client to send LSP messages to the server process. Vitest as the test runner.

**Rationale**: Aligns with Constitution Principle IV (Integration-First Testing) — test the LSP as users experience it (through protocol messages). Unit tests permitted for isolated AST analysis logic. Test fixtures will be `.ts` config file snippets in `test/__fixtures__/`.

## Decision 6: Key AST Patterns to Match

The analyzer must recognize these TypeScript AST patterns:

| Pattern                              | AST Shape                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `tasks.register("name")`             | `CallExpression` → `PropertyAccessExpression(tasks.register)` → `StringLiteral`     |
| `tasks.register("name", fn)`         | Same, with 2 args                                                                   |
| `tasks.register("name", Task, opts)` | Same, with 3 args                                                                   |
| `.config({ ... })`                   | `CallExpression` wrapping the register call via `PropertyAccessExpression(.config)` |
| `dependsOn: ["a", "b"]`              | `PropertyAssignment(dependsOn)` → `ArrayLiteralExpression` → `StringLiteral[]`      |
| `dependsOn: "a"`                     | `PropertyAssignment(dependsOn)` → `StringLiteral`                                   |

## Decision 7: Debounce Strategy

**Decision**: Debounce document re-analysis by 200ms after the last text change. Completions and hover are served from the last cached analysis result (no additional debounce).

**Rationale**: 200ms is the sweet spot — fast enough to feel instant, slow enough to batch rapid keystrokes. Completions need to respond immediately from cached state, not trigger a re-parse.
