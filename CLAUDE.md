# Nadle

A type-safe, Gradle-inspired task runner for Node.js. See [ROADMAP.md](./ROADMAP.md) for vision.

## Project Structure

```
packages/
  kernel/          # @nadle/kernel — shared kernel (zero runtime deps)
  project-resolver/# @nadle/project-resolver — project discovery & workspace scanning
  nadle/           # Core package — the task runner itself
    src/           # Source (91 TS files)
    test/          # Integration + unit tests (51 test files, vitest)
    lib/           # Built output (cli.js, index.js, worker.js)
  eslint-plugin/   # eslint-plugin-nadle — ESLint rules for nadle.config.ts
  language-server/ # LSP for nadle.config.ts (shared across editors)
  vscode-extension/# VS Code extension (bundles language-server)
  create-nadle/    # Scaffolding CLI (npm create nadle)
  docs/            # Docusaurus site (nadle.dev)
  examples/basic/  # Basic example project
  sample-app/      # Richer example with task graphs and caching
  validators/      # Internal package validator
spec/              # Language-agnostic specification (single source of truth)
```

Monorepo managed with **pnpm workspaces**. Nadle builds itself (`nadle.config.ts` at root).

The IntelliJ plugin lives in a separate repo: [nadlejs/intellij-plugin](https://github.com/nadlejs/intellij-plugin).

## Architecture

- **Specification**: `spec/` contains the language-agnostic specification — the single source of
  truth for all Nadle behavior, concepts, and contracts. Always consult these files first when
  understanding or modifying Nadle's behavior. If you discover behavior, concepts, or contracts
  that are missing or outdated in the spec, update the relevant `spec/` files to keep them
  accurate. When updating spec files, also add an entry to `spec/CHANGELOG.md` and bump the
  version in `spec/README.md` following semver (major for breaking behavioral changes, minor
  for new concepts/sections, patch for clarifications).
- **User-facing docs**: `packages/docs/` is the Docusaurus site (nadle.dev). When a change is
  significant to users (new feature, changed behavior, new CLI flag, new API, breaking change),
  update the relevant docs pages. Key areas: `docs/concepts/` for core concepts, `docs/guides/`
  for how-to guides, `docs/api/` for API reference, `docs/config-reference.md` for configuration.
- **Package dependency graph**:
  ```
  @nadle/kernel ──┬──→ @nadle/project-resolver ──┬──→ nadle
                  │                               └──→ @nadle/language-server
                  ├──→ nadle
                  ├──→ eslint-plugin-nadle
                  └──→ @nadle/language-server
  ```
- **`@nadle/kernel`**: Zero-dependency shared package. Workspace identity derivation
  (`deriveWorkspaceId`), task identifier parsing/composition, alias resolution,
  workspace resolution, constants (`ROOT_WORKSPACE_ID`, `VALID_TASK_NAME_PATTERN`).
- **`@nadle/project-resolver`**: Project discovery (`discoverProject`), workspace scanning,
  config file location, workspace dependency resolution. Depends on `@nadle/kernel`.
- **`eslint-plugin-nadle`**: 11 ESLint rules for `nadle.config.ts` files. Flat config only
  (`eslint ^9.0.0`). Presets: `recommended`, `all`. Depends on `@nadle/kernel` for task name
  and dependency validation.
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
- `core/handlers/` — Execute, DryRun, List, CleanCache, ShowConfig
- `core/reporting/` — Reporter, footer renderer (Ink/React)
- `builtin-tasks/` — ExecTask, PnpmTask, CopyTask, DeleteTask

## Development

```bash
pnpm install                  # Install dependencies
nadle check build test        # Full CI pipeline (nadle runs itself)
nadle compile                 # tsgo: compile + type-check kernel, project-resolver, create-nadle, eslint-plugin
nadle bundle                  # tsup: bundle nadle, language-server, vscode-extension
nadle build                   # compile + typecheck + bundle (everything tests need)
nadle testUnit                # All vitest projects (root vitest.config.ts)
```

Run `nadle` directly (a local `.envrc` adds `node_modules/.bin` to PATH via direnv);
`pnpm nadle <task>` works everywhere as fallback. CI invokes bare `nadle` too.

## Code Conventions

- **Cross-platform**: CI runs on Ubuntu, macOS, and Windows. All scripts, shell commands, and
  `package.json` scripts must work on all three platforms. Avoid bash-only syntax like `&&` in
  npm scripts — use `run-s`/`run-p` (npm-run-all2) or Node scripts instead. Prefer `node:path`
  and `node:fs` over shell commands for file operations.
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

- **Build**: tsgo (`nadle compile`, root `tsconfig.compile.json`) for unbundled packages;
  tsup (`nadle bundle`, root `tsup.config.ts`) for nadle (cli/index/worker), language-server,
  and vscode-extension
- **Bundle size limit**: 160 KB (tracked by `size-limit`)
- **API surface**: Tracked by `@microsoft/api-extractor` → `index.api.md`
- **Release**: `release-please` for automated changelog + version bumps
- **CI**: Ubuntu + macOS + Windows, Node 22/24

## Testing

```bash
nadle testUnit                                  # All vitest projects
nadle testUnit -- --project nadle               # Only the nadle suite (passthrough args)
nadle testUnit -- --project kernel              # Kernel tests
pnpm exec vitest run --project nadle basic      # Single test file, no task graph
```

All test configuration lives in the root `vitest.config.ts` (six projects:
nadle, create-nadle, language-server, kernel, project-resolver, eslint-plugin).

- Framework: **vitest** with thread pool, 20s timeout
- Retries: 5 on CI, 2 locally
- Custom matchers in `test/__setup__/matchers/`
- Type-level tests in `*.test-d.ts` files

## Active Technologies

- TypeScript 5.9.3, ESM only, target node22
- **nadle**: tinypool (worker threads), jiti (config loading), tsup (bundler)
- **@nadle/kernel**: zero runtime dependencies
- **@nadle/project-resolver**: `@manypkg/find-root`, `@manypkg/tools`, `find-up`
- **eslint-plugin-nadle**: `@typescript-eslint/utils`, `eslint ^9.0.0` (peer)
