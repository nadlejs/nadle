# Research: Fixture Builder

## Decision 1: Config generation approach — Template strings vs ts-morph

**Decision**: Use template strings for the new ConfigBuilder.

**Rationale**: The existing `createNadleConfig` uses `ts-morph` which creates an in-memory TypeScript project for each config file. This is heavyweight for simple cases (just `configure({...})` or `tasks.register("name")`). Template string concatenation is simpler, faster, and keeps the builder under the 200-line file limit. Task action bodies are passed as raw strings (not AST-manipulated), so ts-morph's AST capabilities are unnecessary.

**Alternatives considered**:

- ts-morph: More robust AST generation, but adds complexity for simple cases. Already exists in `createNadleConfig` for workspace tests — no need to duplicate.
- Code generation library (e.g., `recast`): Overkill for config files that are 3-10 lines.

## Decision 2: Fixture writing approach — Extend withFixture vs new helper

**Decision**: Add a `withGeneratedFixture` function alongside the existing `withFixture`.

**Rationale**: `withFixture` requires a `fixtureDir` parameter pointing to a physical directory under `__fixtures__/`. For fully generated fixtures, no base directory exists. A new helper that writes `DirJSON` to a temp directory, creates the `node_modules/nadle` symlink, and provides the same `{ exec, cwd }` callback pattern is cleaner than overloading `withFixture` with a "no base dir" mode.

**Alternatives considered**:

- Overload `withFixture` to accept `files` without `fixtureDir`: Muddies the API — existing callers always have a fixtureDir.
- Use `withTemp` + manual fixturify write: Works but duplicates cleanup/preserve logic and misses symlink creation.

## Decision 3: Module resolution symlink strategy

**Decision**: Use the nadle package root (computed from `fixturesDir` constant) as an absolute symlink target for `node_modules/nadle`.

**Rationale**: All existing fixtures use relative symlinks (`../../../..`) created by pnpm. For generated fixtures in `test/__temp__/<hash>/`, the same relative depth applies (4 levels up from `node_modules/nadle` to `packages/nadle/`). However, an absolute symlink is more robust since the temp directory depth is fixed. Computing the target from the known `fixturesDir` constant (`Path.resolve(fixturesDir, "..", "..")`) gives the package root reliably.

**Alternatives considered**:

- Relative symlink (`../../../..`): Works but fragile if temp directory structure changes.
- Running `pnpm install` in temp dir: Too slow for per-test execution.

## Decision 4: Config option serialization

**Decision**: Use `JSON.stringify` for config option objects.

**Rationale**: Config options passed to `configure()` and `.config()` are simple data (numbers, strings, plain objects). `JSON.stringify` produces valid JavaScript literal syntax for these types. Percentage strings like `"25%"` serialize correctly as `"25%"`. No function values or special types need serialization in the config options (task action bodies are passed as raw strings, not through serialization).

**Alternatives considered**:

- `serialize-javascript`: Handles functions and regexes, but we don't need those for config options. Already used by `createNadleConfig` but adds unnecessary complexity here.
