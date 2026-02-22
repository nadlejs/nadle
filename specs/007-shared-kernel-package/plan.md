# Implementation Plan: Shared Kernel Package (`@nadle/kernel`)

**Branch**: `007-shared-kernel-package` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-shared-kernel-package/spec.md`

## Summary

Extract pure workspace resolution, task identifier parsing, alias mapping, and shared constants from `packages/nadle` into a new `packages/kernel` package (`@nadle/kernel`). Nadle core replaces its inlined implementations with imports from the kernel. The shared package has zero runtime dependencies and is consumable by the language server, ESLint plugin, and IntelliJ plugin.

## Technical Context

**Language/Version**: TypeScript 5.9.3, target node22, ESM only
**Primary Dependencies**: None (zero runtime dependencies)
**Storage**: N/A
**Testing**: vitest (unit tests only — pure functions, no CLI spawning needed)
**Target Platform**: Node.js 22/24 (Linux, macOS, Windows)
**Project Type**: Library package in existing pnpm monorepo
**Performance Goals**: N/A (pure string operations, sub-microsecond)
**Constraints**: Bundle size < 5 KB, zero runtime dependencies, must not break any existing nadle tests
**Scale/Scope**: ~150-200 lines of source, ~10 exported functions/types

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Status    | Notes                                                                                                                                                                             |
| ------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Code Over Configuration            | PASS      | No configuration files involved                                                                                                                                                   |
| II. Type Safety First                 | PASS      | All exports fully typed, strict mode                                                                                                                                              |
| III. Lightweight and Focused          | PASS      | Zero dependencies, < 5 KB. Does not affect nadle's 140 KB budget (separate package)                                                                                               |
| IV. Integration-First Testing         | DEVIATION | Unit tests are appropriate here — the kernel exports pure functions with no CLI or worker thread behavior. Nadle core's existing integration tests validate the kernel indirectly |
| V. Self-Hosting                       | PASS      | Nadle continues to build itself; kernel is a build-time dependency                                                                                                                |
| VI. Modern ESM and Strict Conventions | PASS      | ESM only, node22 target, PascalCase node imports                                                                                                                                  |
| VII. Cross-Platform Correctness       | PASS      | Windows backslash normalization is core to the kernel                                                                                                                             |

## Project Structure

### Documentation (this feature)

```text
specs/007-shared-kernel-package/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── kernel-api.ts
└── tasks.md
```

### Source Code (repository root)

```text
packages/kernel/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── index.ts              # Public API barrel export
│   ├── constants.ts           # COLON, SLASH, BACKSLASH, DOT, ROOT_WORKSPACE_ID
│   ├── task-identifier.ts     # parse(), compose(), isWorkspaceQualified()
│   ├── workspace-identity.ts  # WorkspaceIdentity type, deriveWorkspaceId()
│   ├── alias-resolver.ts      # AliasOption type, createAliasResolver()
│   └── workspace-resolver.ts  # resolveWorkspace(), validateAliases()
└── test/
    ├── task-identifier.test.ts
    ├── workspace-identity.test.ts
    ├── alias-resolver.test.ts
    └── workspace-resolver.test.ts
```

**Structure Decision**: Single flat `src/` directory — the package is small enough that subdirectories add no value. Tests mirror source files 1:1.

## Complexity Tracking

| Deviation                                              | Why Needed                                                                                                                     | Simpler Alternative Rejected Because                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Unit tests instead of integration tests (Principle IV) | Kernel exports pure functions — no CLI, no workers, no I/O. Integration tests in nadle core already cover this code end-to-end | Spawning CLI processes to test string parsing would be gratuitous overhead |
