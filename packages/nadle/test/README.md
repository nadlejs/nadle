# Test Patterns

This document describes the testing conventions, custom matchers, helpers, and patterns used
in the nadle test suite.

## Directory Structure

```
test/
├── __fixtures__/        # Test fixture directories (config files, package.json, source files)
├── __setup__/           # Test infrastructure (matchers, helpers, serialization)
│   └── matchers/        # Custom vitest matchers
├── __snapshots__/       # Centralized snapshot files
├── __temp__/            # Auto-cleaned temp directories (created at runtime)
├── builtin-tasks/       # Tests for ExecTask, PnpmTask, CopyTask, DeleteTask
├── features/            # Feature-level integration tests (caching, workspaces, etc.)
├── options/             # CLI option tests (--dry-run, --list, --config, etc.)
├── unit/                # Unit tests (format-time, task-input-resolver)
├── basic.test.ts        # Core task execution tests
├── register.test-d.ts   # Type-level tests
└── ...
```

## Running Tests

```bash
pnpm -F nadle test              # All tests
pnpm -F nadle test basic        # Single test file (substring match)
pnpm -F nadle test -- --retry 0 # Skip retries for debugging
```

## Custom Matchers

All matchers operate on stdout strings captured from CLI executions.

### `toRun(taskName)`

Verifies a task was executed (appeared in stdout as `STARTED`).

```typescript
expect(stdout).toRun("compile");
```

### `toRunInOrder(...groups)`

Verifies tasks executed in dependency order. Each group's `DONE` must precede
the next group's `STARTED`. Groups can be arrays for parallel tasks.

```typescript
expect(stdout).toRunInOrder("install", "compile", "test");
expect(stdout).toRunInOrder("install", ["compile-ts", "compile-svg"], "test");
```

### `toDoneInOrder(...tasks)`

Verifies tasks completed in strict sequential order (each task's `DONE` before the next).

```typescript
expect(stdout).toDoneInOrder("task-a", "task-b", "task-c");
```

### `toSettle(taskId, status)`

Verifies a task reached a specific settlement status: `"done"`, `"up-to-date"`,
`"from-cache"`, or `"failed"`.

```typescript
expect(stdout).toSettle("compile", "done");
expect(stdout).toSettle("compile", "up-to-date");
```

### `toThrowPlainMessage(expectedText)`

Asserts a function throws an error containing the expected text (ANSI codes stripped).

```typescript
expect(() => { throw new Error("task not found"); }).toThrowPlainMessage("not found");
```

## CLI Execution Helpers

### `createExec(options?)`

Creates a configured function for running the nadle CLI. Defaults auto-inject
`--max-workers 1` and `--no-footer` for deterministic output.

```typescript
const exec = createExec({ config: "basic", cwd: "/path/to/fixture" });
const result = exec`install test --dry-run`;
```

Options:
- `config` — Config file name (auto-prefixed: `"basic"` → `nadle.basic.ts`)
- `cwd` — Working directory
- `env` — Environment variables (defaults: `CI=false`, `TEST=true`)

### `getStdout(resultPromise)`

Extracts and formats stdout from a successful CLI run. Asserts `exitCode === 0`.

```typescript
const stdout = await getStdout(exec`build`);
expect(stdout).toRun("build");
```

### `getStderr(resultPromise)`

Extracts stderr from a failing CLI run. Asserts `exitCode !== 0`.

```typescript
const stderr = await getStderr(exec`unknown-task`);
expect(stderr).toContain("not found");
```

## Snapshot Helpers

### `expectPass(resultPromise)`

Asserts the CLI succeeded and snapshots the full output (cwd, command, stdout, stderr).

```typescript
await expectPass(exec`build --dry-run`);
```

### `expectFail(resultPromise)`

Asserts the CLI failed and snapshots the full failure context.

```typescript
await expectFail(exec`unknown-task`);
```

## Fixture Helpers

### `withFixture({ fixtureDir, files, testFn })`

Creates an isolated temp copy of a fixture directory, runs the test, then cleans up.
On failure, the temp directory is preserved and its path is logged.

```typescript
await withFixture({
  fixtureDir: "caching",
  files: { "src/index.ts": "export const x = 1;" },
  async testFn({ exec, cwd, getFiles }) {
    const stdout = await getStdout(exec`build`);
    expect(stdout).toRun("build");
  }
});
```

### `createNadleConfig({ configure?, tasks? })`

Generates a `nadle.config.ts` string with task registrations and optional configuration.

```typescript
createNadleConfig({
  configure: { cacheDir: ".custom-cache" },
  tasks: [
    { name: "build", log: "Building..." },
    { name: "test", log: "Testing...", config: { dependsOn: ["build"] } }
  ]
});
```

### `createPackageJson(name?, otherFields?)`

Generates a `package.json` string with `type: "module"` by default.

### `createFileModifier(baseDir)`

Tracks file changes (add/modify/delete) for multi-step tests. Call `restore()` to revert.

## Serialization Pipeline

Snapshots are normalized through a 12-step pipeline (in `serialize.ts`) to ensure
deterministic output across environments:

1. **ANSI codes** → readable tags (`<Red>`, `<Bold>`)
2. **Durations** → `{duration}`
3. **Error pointers** → `{ErrorPointer}`
4. **File locations** → `{file}:{location}`
5. **Git Bash paths** → backslash format
6. **Relative paths** → forward slashes
7. **Absolute paths** → `/ROOT/...`
8. **Stack traces** → `{stackTrace...}`
9. **Hashes** → `__{hash}__`
10. **Versions** → `{version}`
11. **Unstable lines** → removed (Node warnings, experimental features)
12. **Trailing spaces** → trimmed

## Type-Level Tests

Files ending in `.test-d.ts` use vitest's `expectTypeOf` for compile-time type assertions:

```typescript
expectTypeOf(tasks.register("check")).toEqualTypeOf<TaskConfigurationBuilder>();
expectTypeOf(tasks.register("check").config({ inputs: Inputs.files("*.ts") })).toEqualTypeOf<void>();
```

## When to Write Which Test Type

| Type | When | Example |
|------|------|---------|
| **Integration** (default) | Any user-visible behavior — task execution, CLI options, error messages | `test/basic.test.ts` |
| **Unit** | Pure functions with no CLI interaction | `test/unit/format-time.test.ts` |
| **Type-level** | Public API type signatures | `test/register.test-d.ts` |

Prefer integration tests. The CLI is the contract — if it works end-to-end, internals can
be refactored freely.
