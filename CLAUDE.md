# Nadle

A type-safe, Gradle-inspired task runner for Node.js. See [ROADMAP.md](./ROADMAP.md) for vision.

## Project Structure

```
packages/
  nadle/           # Core package — the task runner itself
    src/           # Source (91 TS files)
    test/          # Integration + unit tests (51 test files, vitest)
    lib/           # Built output (cli.js, index.js, worker.js)
  create-nadle/    # Scaffolding CLI (npm create nadle)
  docs/            # Docusaurus site (nadle.dev)
  examples/basic/  # Basic example project
  sample-app/      # Richer example with task graphs and caching
  validators/      # Internal package validator
```

Monorepo managed with **pnpm workspaces**. Nadle builds itself (`nadle.config.ts` at root).

## Architecture

- **Entry**: `src/cli.ts` (yargs) → `Nadle` class → handler chain
- **Task lifecycle**: Registration (`tasks.register`) → Scheduling (topological sort, DAG) →
  Execution (tinypool worker threads) → Reporting
- **Caching**: Input fingerprinting + output snapshots in `.nadle/` directory
- **Config loading**: `jiti` transpiles `nadle.config.ts` at runtime
- **Public API**: Exported from `src/index.ts`, tracked by `api-extractor` in `index.api.md`

Key source directories under `packages/nadle/src/`:
- `core/registration/` — `tasks` API, `TaskRegistry`, `defineTask()`
- `core/engine/` — `TaskScheduler` (DAG), `TaskPool` (workers), `worker.ts`
- `core/caching/` — `CacheValidator`, `CacheManager`
- `core/models/project/` — Project, Workspace, dependency resolvers
- `core/handlers/` — Execute, DryRun, List, CleanCache, ShowConfig
- `core/reporting/` — Reporter, footer renderer (Ink/React)
- `builtin-tasks/` — ExecTask, PnpmTask, CopyTask, DeleteTask

## Development

```bash
pnpm install                          # Install dependencies
npx nadle check build test --summary  # Full CI pipeline (nadle runs itself)
pnpm -F nadle test                    # Run tests only
pnpm -F nadle build:tsup              # Build core package
```

## Code Conventions

- **ESM only**, target `node22`
- **TypeScript strict mode**
- Node built-in imports use **PascalCase default** only: `import Path from "node:path"`
  (no named/namespace imports from `node:` modules — enforced by eslint)
- **No `process.cwd()`** in core source — use `projectDir` / `workingDir` context instead
  (enforced by eslint)
- **No direct `consola` import** — use the `logger` abstraction
- Source file limits: max 200 lines, max 50 lines/function, max complexity 10, max 3 params
- Tests are **integration-first**: spawn CLI via `execa`, assert on stdout with custom matchers
  (`toRunInOrder`, `toDoneInOrder`, `toSettle`, `toRun`)
- Test fixtures live in `test/__fixtures__/`, temp dirs in `__temp__/`

## Build & Release

- **Build**: `tsup` (3 entry points: cli, index, worker)
- **Bundle size limit**: 140 KB (tracked by `size-limit`)
- **API surface**: Tracked by `@microsoft/api-extractor` → `index.api.md`
- **Release**: `release-please` for automated changelog + version bumps
- **CI**: Ubuntu + macOS + Windows, Node 22/24

## Testing

```bash
pnpm -F nadle test                    # All tests
pnpm -F nadle test basic              # Single test file
```

- Framework: **vitest** with thread pool, 20s timeout
- Retries: 5 on CI, 2 locally
- Custom matchers in `test/__setup__/matchers/`
- Type-level tests in `*.test-d.ts` files
