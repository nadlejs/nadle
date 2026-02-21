# Research: ESLint Plugin for Nadle

## Decision 1: Plugin Architecture (ESM vs CJS Dynamic Loading)

**Decision**: Rewrite plugin to use static ESM imports with explicit rule registration instead of CJS dynamic `require()`/`__dirname` loading.

**Rationale**: The existing skeleton uses `require()`, `__dirname`, and `Fs.readdirSync()` to dynamically discover rules — all CJS patterns incompatible with ESM. Since the rule set is known at build time, static imports are simpler, faster, and tree-shakeable.

**Alternatives considered**:

- Dynamic `import()` with `import.meta.dirname` — unnecessary complexity for a known rule set
- Keep CJS with `export =` — incompatible with ESM-only monorepo convention

## Decision 2: Build Tool

**Decision**: Use plain `tsc` (not tsup) for compilation.

**Rationale**: The plugin has no need for bundling — it's a library consumed by ESLint. `tsc` produces clean ESM output with declaration files. Simpler build, fewer dependencies.

**Alternatives considered**:

- tsup — used by other packages but overkill here; adds unnecessary bundling step

## Decision 3: Rule Testing Approach

**Decision**: Use `@typescript-eslint/rule-tester` with vitest as the test runner.

**Rationale**: `RuleTester` is the standard way to test ESLint rules. It provides `valid`/`invalid` test case arrays with expected error assertions. Vitest integration via `RuleTester.afterAll` hook is well-documented.

**Alternatives considered**:

- Raw ESLint `Linter` API — lower-level, more boilerplate
- eslint-plugin-tester — additional dependency, less ecosystem support

## Decision 4: AST Pattern for Task Registration Detection

**Decision**: Match `CallExpression` where callee is `MemberExpression` with object named `tasks` and property named `register`. Extract the first argument as the task name (string literal only).

**Rationale**: This matches all three registration forms from the spec: `tasks.register(name)`, `tasks.register(name, fn)`, `tasks.register(name, task, resolver)`. The `tasks` identifier is the canonical import from nadle.

**Alternatives considered**:

- Match any `.register()` call — too broad, false positives
- Require import tracking — overly complex for v1; `tasks` is an unambiguous identifier

## Decision 5: Config Preset Severity Mapping

**Decision**: Two presets with the following severity mapping:

**`recommended`** (subset, appropriate severity):
| Rule | Severity |
|------|----------|
| `no-anonymous-tasks` | error |
| `no-duplicate-task-names` | error |
| `valid-task-name` | error |
| `valid-depends-on` | error |
| `require-task-description` | warn |
| `require-task-inputs` | warn |
| `no-sync-in-task-action` | warn |
| `no-process-cwd` | warn |
| `padding-between-tasks` | warn |

**`all`** — all rules at `error` level (including `no-circular-dependencies` and `prefer-builtin-task`).

**Rationale**: Correctness rules that catch definite bugs are errors. Style/best-practice rules are warnings. `no-circular-dependencies` and `prefer-builtin-task` are excluded from recommended because they rely on heuristic analysis and may produce noise in complex configs.

## Decision 6: File Scoping in Config Presets

**Decision**: Both `recommended` and `all` configs include `files: ["**/nadle.config.*"]` to scope rules to nadle config files only.

**Rationale**: Clarified in spec session — prevents false positives on unrelated files that may have `tasks.register()` calls. Users can override the files pattern if needed.

## Decision 7: Detecting Task Actions for Scope-Aware Rules

**Decision**: Rules like `no-sync-in-task-action`, `no-process-cwd`, and `prefer-builtin-task` identify "task action" scope by checking if a function is:

1. The second argument to `tasks.register(name, fn)` (function form)
2. The `run` method of a `defineTask()` object (typed task form)

Only code within these scopes triggers the rules.

**Rationale**: Reporting on all sync calls or `process.cwd()` in a config file would be too noisy. Config-level setup code legitimately uses sync APIs. Only task action code runs in workers where async matters.

**Alternatives considered**:

- Report globally in config files — too many false positives
- Track function call depth — overly complex for v1
