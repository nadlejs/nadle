# Implementation Plan: ESLint Plugin for Nadle

**Branch**: `005-eslint-plugin` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-eslint-plugin/spec.md`

## Summary

Move `eslint-plugin-nadle` from the standalone `nadlejs/eslint-plugin-nadle` repo into the nadle monorepo at `packages/eslint-plugin`. Rewrite the CJS skeleton to ESM with static imports. Implement 11 ESLint rules for `nadle.config.ts` files covering correctness, best practices, and style. Add `recommended` and `all` config presets scoped to `nadle.config.*` files. Build with tsc, test with vitest + `@typescript-eslint/rule-tester`.

## Technical Context

**Language/Version**: TypeScript 5.9.3, target node22
**Primary Dependencies**: `@typescript-eslint/utils` (rule creation), `@typescript-eslint/rule-tester` (testing), `eslint ^9.0.0` (peer)
**Storage**: N/A
**Testing**: vitest 4.0.18 + `@typescript-eslint/rule-tester`
**Target Platform**: Node.js 22+, ESLint 9+ flat config
**Project Type**: Library package in pnpm monorepo
**Performance Goals**: Zero perceptible overhead during ESLint runs
**Constraints**: Bundle <50 KB, source file max 200 lines, max 50 lines/function, max complexity 10, max 3 params
**Scale/Scope**: 11 rules, 2 config presets, ~15-20 source files

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Status  | Notes                                                                                                                                                                   |
| ------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Code Over Configuration            | PASS    | Plugin analyzes TypeScript config files, not declarative schemas                                                                                                        |
| II. Type Safety First                 | PASS    | Rules use `@typescript-eslint/utils` typed AST; plugin exports typed API                                                                                                |
| III. Lightweight and Focused          | PASS    | Separate package (not in nadle core), no impact on 140KB core limit; own 50KB limit                                                                                     |
| IV. Integration-First Testing         | ADAPTED | ESLint rules use RuleTester pattern (valid/invalid test cases) — this is the integration-first equivalent for ESLint plugins. Not CLI-spawning since this is a library. |
| V. Self-Hosting                       | PASS    | Plugin will be used in the monorepo's own eslint.config.ts after completion                                                                                             |
| VI. Modern ESM and Strict Conventions | PASS    | ESM only, PascalCase node imports, no process.cwd() in source                                                                                                           |
| VII. Cross-Platform Correctness       | PASS    | Pure AST analysis, no filesystem operations, no platform-specific code                                                                                                  |

**Post-Phase 1 re-check**: All gates still pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-eslint-plugin/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── plugin-api.md
├── checklists/
│   └── requirements.md
└── tasks.md              (Phase 2 — /speckit.tasks)
```

### Source Code (repository root)

```text
packages/eslint-plugin/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── src/
│   ├── index.ts                      # Plugin entry: exports rules, configs, meta
│   ├── utils/
│   │   └── ast-helpers.ts            # Shared AST utilities (task registration detection, etc.)
│   └── rules/
│       ├── no-anonymous-tasks.ts
│       ├── no-duplicate-task-names.ts
│       ├── no-circular-dependencies.ts
│       ├── valid-task-name.ts
│       ├── valid-depends-on.ts
│       ├── require-task-description.ts
│       ├── require-task-inputs.ts
│       ├── no-sync-in-task-action.ts
│       ├── no-process-cwd.ts
│       ├── padding-between-tasks.ts
│       └── prefer-builtin-task.ts
└── test/
    ├── rules/
    │   ├── no-anonymous-tasks.test.ts
    │   ├── no-duplicate-task-names.test.ts
    │   ├── no-circular-dependencies.test.ts
    │   ├── valid-task-name.test.ts
    │   ├── valid-depends-on.test.ts
    │   ├── require-task-description.test.ts
    │   ├── require-task-inputs.test.ts
    │   ├── no-sync-in-task-action.test.ts
    │   ├── no-process-cwd.test.ts
    │   ├── padding-between-tasks.test.ts
    │   └── prefer-builtin-task.test.ts
    └── configs.test.ts               # Test config presets export correctly
```

**Structure Decision**: Single library package within the existing monorepo. Flat `rules/` directory with one file per rule. Shared AST utilities extracted to `utils/` to keep rule files under 200 lines. Tests mirror source structure.

## Implementation Phases

### Phase 1: Package Setup & Plugin Skeleton

1. Rewrite `src/index.ts` from CJS to ESM with static rule imports
2. Create `src/utils/ast-helpers.ts` with shared utilities:
   - `isTasksRegisterCall(node)` — detect `tasks.register()` calls
   - `getTaskName(node)` — extract string literal task name
   - `getConfigObject(node)` — find `.config()` call and extract its argument
   - `isInTaskAction(node)` — check if a node is inside a task action scope
3. Add `@typescript-eslint/rule-tester` to devDependencies
4. Add release-please config entry for `packages/eslint-plugin`
5. Add `.release-please-manifest.json` entry
6. Add nadle.config.ts for the package (build + test tasks)

### Phase 2: Correctness Rules (P1)

Implement the 5 correctness rules — these are the highest priority:

1. **`no-anonymous-tasks`**: Visit CallExpression, check if `tasks.register()` first arg is a string literal
2. **`no-duplicate-task-names`**: Track seen names in module scope, report second occurrence
3. **`valid-task-name`**: Validate task name string against `^[a-z]([a-z0-9-]*[a-z0-9])?$`
4. **`valid-depends-on`**: In `.config()` objects, check `dependsOn` is a string or array of strings
5. **`no-circular-dependencies`**: Build dependency graph from `dependsOn` string literals, detect cycles with DFS

Each rule includes: meta with docs/messages/type, create function, tests (≥3 valid + ≥3 invalid cases).

### Phase 3: Best Practice & Style Rules (P2-P3)

1. **`require-task-description`**: Check `.config()` has `description` property
2. **`require-task-inputs`**: Check if `.config()` has `outputs` but not `inputs`
3. **`no-sync-in-task-action`**: Inside task action scope, flag sync API calls (`readFileSync`, `execSync`, etc.)
4. **`no-process-cwd`**: Inside task action scope, flag `process.cwd()` calls
5. **`padding-between-tasks`**: Check consecutive `tasks.register()` expression statements have a blank line between them; provide autofix

### Phase 4: Suggestion Rules (P4)

1. **`prefer-builtin-task`**: Inside task actions, detect patterns matching built-in tasks:
   - `execa`/`child_process.exec`/`spawn` → suggest `ExecTask`
   - `execa` with `pnpm` as first arg → suggest `PnpmTask`
   - `fs.cp`/`fs.copyFile` patterns → suggest `CopyTask`
   - `rimraf`/`fs.rm` patterns → suggest `DeleteTask`

### Phase 5: Config Presets & Integration

1. Build `recommended` and `all` config objects with `files: ["**/nadle.config.*"]`
2. Write `test/configs.test.ts` to verify preset structure
3. Add `eslint-plugin-nadle` to the monorepo's own `eslint.config.ts`
4. Run against existing `nadle.config.ts` files to verify zero false positives (SC-003)
5. Update `packages/validators/src/validate-packages.ts` if needed for the new package

### Phase 6: Documentation & Release Setup

1. Create `docs/guides/eslint-plugin.md` with installation, configuration, and rule reference
2. Update docs sidebar
3. Verify release-please config produces correct tags/changelogs
