# Spec Changelog

All notable changes to the Nadle specification are documented in this file.

Versioning follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Backward-incompatible behavioral change, removed concept, or redefined contract
- **MINOR**: New concept, new section, or materially expanded rules
- **PATCH**: Clarifications, corrections, wording improvements

## 3.12.0 — 2026-06-14

### Added

- 09-cli: `--json` flag. Switches the read-only inspection commands (`--list`,
  `--list-workspaces`, `--dry-run`, `--graph`, `--explain`) to emit a single
  machine-readable JSON document on standard output — no banner, footer, colors,
  or run summary, and the live footer is forced off. `--list --json` reports each
  task's `name`, `label`, `group`, `description`, `dependsOn`, `inputs`, `outputs`,
  and `workspace`. `--show-config`/`--config-key` already emit JSON and are
  unaffected.

## 3.11.0 — 2026-06-14

### Added

- 09-cli: `--doctor` handler. Runs read-only diagnostics (project summary, cache
  directory writability, partial-cacheability smells, stale/missing outputs) and
  prints per-check ok/warning/error lines plus a summary. Exits non-zero only on
  an error-level finding; performs no execution and mutates nothing.

## 3.10.0 — 2026-06-14

### Added

- 09-cli: Shell completion. A `completion` command prints a bash/zsh/fish
  completion script; once installed, TAB completes option flags and the live
  task names discovered from the configuration. The completion command and
  callback emit no other output.

## 3.9.0 — 2026-06-14

### Added

- 02-task-configuration / 04-execution: Task `timeout` (milliseconds, positive
  integer) and `retries` (non-negative integer, default 0). A task runs up to
  `1 + retries` attempts; each attempt is bounded by `timeout` and an over-time
  attempt fails (eligible for retry). Both apply only to the task function, not
  to cache restore. Invalid values raise a configuration error.

## 3.8.0 — 2026-06-14

### Added

- 14-plugins: New dedicated section specifying the plugin authoring contract —
  the plugin model (`name`/`enforce`/`hooks`/`tasks`/`reporters`), `use()`
  application and deduplication semantics, `definePlugin`, the four lifecycle
  hooks with their context shapes, contributed task types, and custom reporters.
  Previously plugin behavior was only mentioned incidentally in 11-events and
  13-reporting.

### Changed

- 09-cli: Added the `--reporter` flag to the General Options table.

### Fixed

- 02-task-configuration: Removed the false claim that `dependsOn` falls back to
  the root workspace when a task is not found in the target workspace. There is
  no implicit fallback; a missing task is an error (use `"root:taskName"` to
  depend on a root task).
- 07-workspace: Workspace dependencies are derived only from `dependencies` and
  `devDependencies`; `peerDependencies`/`optionalDependencies` are excluded.
  Previously all four were listed.
- 09-cli: Corrected the `--cache-dir` default to
  `<projectDir>/node_modules/.cache/nadle` (was `<projectDir>/.nadle`).
- 12-error-handling: Removed two error rows (empty/duplicate workspace label)
  that are not raised by the implementation, and the stale "Task not found (with
  suggestions) … with fallback" row.

## 3.7.0 — 2026-06-13

### Added

- 11-events / 13-reporting: Plugin system. A plugin (applied with `use(plugin, options?)`
  in config) contributes task types, lifecycle hooks (`beforeAll`/`afterAll`/`beforeTask`/
  `afterTask`, dispatched main-thread from the existing events; `beforeAll` may abort,
  teardown errors downgrade to warnings; `beforeTask` is skipped for cache hits), and
  custom reporters (selected by `--reporter <name>`, opening the previously-closed reporter
  name space). Hook order follows an optional `enforce: "pre" | "post"`.

## 3.6.0 — 2026-06-13

### Added

- 02-task-configuration: A callback-form `.config()` is now resolved lazily and
  memoized — evaluated at most once per task per invocation, only when the
  configuration is first needed (configuration avoidance, #647). Callbacks must be
  pure with respect to that single evaluation.

## 3.5.0 — 2026-06-13

### Changed

- 09-cli: `--summary` now prints profiling insights — in addition to the slow-task
  duration table, it shows the **critical path** (longest cumulative-duration
  dependency chain) and **cache-miss hotspots** (executed tasks ranked by duration,
  each with a suggestion: declare inputs/outputs to enable caching, or an input
  changed). Folded into `--summary` rather than a separate flag.

## 3.4.0 — 2026-06-13

### Added

- 09-cli: `--since <ref>` for affected-only execution. The Execute handler filters
  the requested (expanded) task set to those whose workspace directory contains a file
  changed since the git ref (via `git diff --name-only <ref>`), pulling in the
  dependencies an affected task needs. Reports and runs nothing when no task is
  affected. Cross-workspace dependent propagation is out of scope for this version.

## 3.3.0 — 2026-06-13

### Added

- 09-cli: Document the introspection flags and their handlers, which had been
  implemented but not yet specified — `--watch` (re-run on input change), `--graph`
  (`tree`/`mermaid` dependency graph), `--explain` (static single-task explanation:
  why it runs, dependents, inputs), and `--why` (per-task cache-outcome explanation).
  Handler-chain table updated to the actual order: Graph and Explain run before
  DryRun/ShowConfig; Watch runs before the default Execute handler.

## 3.2.0 — 2026-06-11

### Added

- 10-builtin-tasks: DownloadTask — HTTP(S) download into a directory with optional
  SHA-256 verification; matching existing files skip the download, mismatches fail
  the task and remove the file.

## 3.1.0 — 2026-06-11

### Added

- 10-builtin-tasks: ZipTask — creates a zip archive from file selections, with an
  optional entry-name `prefix`; duplicate entry names fail the task.
- 10-builtin-tasks: UnzipTask — extracts an archive into a directory, with optional
  `include` entry filtering; path-traversal entries fail the task.

## 3.0.0 — 2026-06-11

### Changed (BREAKING)

- 10-builtin-tasks: Argument Normalization — all exec-based tasks now share one
  semantic for a string `args` value: split into arguments on spaces, with
  backslash-escaped spaces preserved (previously only ExecTask split;
  NodeTask/NpmTask/NpxTask/PnpmTask/PnpxTask treated the whole string as a single
  argument). Array values are unchanged.

## 2.1.0 — 2026-06-11

### Added

- 10-builtin-tasks: MoveTask — CopyTask semantics plus source removal (rename
  syscall with copy-then-delete fallback; skipped files keep their source).
- 10-builtin-tasks: SyncTask — mirrors sources into the destination, deleting
  extraneous files (except `preserve` matches) and pruning empty directories.

## 2.0.0 — 2026-06-11

### Changed (BREAKING)

- 10-builtin-tasks: CopyTask redesign — the `to` option is removed; `into` is the
  required destination and is always a directory (the previous file-or-directory
  destination guessing is gone). `from` accepts multiple sources (paths or selectors).

### Added

- 10-builtin-tasks: File Selections — a shared source vocabulary for file-operation
  tasks (path string or `{ dir, include?, exclude? }` selector).
- 10-builtin-tasks: CopyTask options — `flatten`, `rename` (by base name), `overwrite`
  (`replace`/`skip`/`error`), and `strict`; destination-collision detection.

## 1.13.0 — 2026-06-10

### Added

- 09-cli: Argument passthrough — CLI args after the first bare `--` are captured
  verbatim and delivered only to explicitly requested tasks (glob matches included);
  dependency tasks never receive them. Args are exposed on the runner context
  (`passthroughArgs`), appended by exec-based builtin tasks, included in the cache
  key of requested tasks, surfaced in dry run, and a notice is logged when more than
  one requested task receives them.
- 10-builtin-tasks: Documented which builtin tasks consume passthrough arguments
  (exec-based ones append; CopyTask and DeleteTask ignore).

## 1.12.0 — 2026-06-07

### Added

- 08-configuration-loading: Runtime validation of `configure()` options — malformed
  values (wrong type, invalid enum, non-positive numbers, empty `cacheDir`,
  malformed worker counts, non-object/function `alias`) now raise a configuration
  error (exit code 2) at config-load time instead of failing later or silently.

## 1.11.0 — 2026-06-07

### Changed

- 06-project: Root detection — when there is no `nadle.root` marker and no
  recognizable monorepo, Nadle now falls back to the closest ancestor directory
  containing a `package.json` (treated as a single-package project) instead of
  failing. An error is raised only when no `package.json` exists in any ancestor.

## 1.10.0 — 2026-06-07

### Added

- 09-cli: Glob task selection — a task-name input containing glob characters
  (`*`, `?`, `[`, `]`, `{`, `}`, `!`) expands to all registered task names that
  match, in the target workspace (falling back to root) or within a
  workspace-qualified pattern. Applies to `--exclude` too. A pattern matching no
  task is an error (exit code 3).

## 1.9.0 — 2026-06-07

### Added

- 10-builtin-tasks: PnpmTask `filter` option — scopes the command to specific
  workspace package(s) by prepending `--filter <value>` flag(s) before `args`.

## 1.8.0 — 2026-06-07

### Changed

- 01-task: Typed-task registration — `optionsResolver` is now optional when the
  options type has no required fields (an empty object satisfies it), defaulting
  to `{}`. It remains mandatory when any field is required.

## 1.7.0 — 2026-06-07

### Added

- 13-reporting: Reporters — `reporter` option (`--reporter`) selects output style.
  New `agent` reporter emits compact, plain, low-noise output (one line per task
  plus a summary line) for AI agents and scripts. `default` remains the
  human-oriented reporter.
- 12-error-handling: NadleError subclass hierarchy — `ConfigurationError` (exit
  code 2), `TaskNotFoundError` (3), `CyclicDependencyError` (4), and
  `TaskExecutionError` (1, wraps the original task error as `cause`). Lets
  consumers catch specific error categories. Invariant violations remain plain
  `Error`.

## 1.6.0 — 2026-02-25

### Added

- 05-caching: Dependency fingerprints — downstream tasks automatically invalidate
  when upstream task outputs change. Cache key now includes `dependencyFingerprints`.
- 05-caching: Task options in cache key — cache key now includes resolved
  `options` from `optionsResolver`, invalidating cache when options change.
- 05-caching: Cache eviction — per-task LRU eviction with configurable
  `maxCacheEntries` (default: 5). Old entries pruned after cache-miss saves.
- 05-caching: Corruption recovery — corrupted JSON metadata treated as cache miss,
  failed cache restores fall back to re-execution.
- 05-caching: File I/O concurrency limits for cache save/restore operations.
- 05-caching: Atomic metadata writes (write-then-rename) to prevent corruption.

## 1.5.1 — 2026-02-24

### Changed

- 05-caching: Default cache directory changed from `.nadle/` to
  `node_modules/.cache/nadle/` to align with JS ecosystem conventions.

## 1.5.0 — 2026-02-22

### Added

- 03-scheduling: Added implicit workspace dependencies section — automatic task
  dependency edges based on workspace `package.json` relationships, including
  resolution rules, deduplication, and opt-out via `implicitDependencies: false`.
- 03-scheduling: Added root task aggregation — root workspace tasks automatically
  depend on all expanded child workspace tasks when `implicitDependencies` is enabled.
- 07-workspace: Updated workspace dependencies to reference implicit dependency
  resolution behavior.
- 08-configuration-loading: Added `implicitDependencies` option to `configure()`
  and built-in defaults (default: `true`).

## 1.4.1 — 2026-02-22

### Changed

- 09-cli, 13-reporting: Footer default is now `!isCI && isTTY` instead of `!isCI`.
  The footer is automatically disabled when stdout is not a TTY (piped or redirected
  output), matching the behavior of Vitest and other modern CLI tools.

## 1.4.0 — 2026-02-21

### Added

- 10-builtin-tasks: Added NodeTask for running Node.js scripts directly via
  `node <script> <args>`.

## 1.3.0 — 2026-02-21

### Added

- 10-builtin-tasks: Added NpmTask, PnpxTask, and NpxTask. NpmTask runs npm commands
  (mirroring PnpmTask). PnpxTask and NpxTask run locally-installed package binaries
  via `pnpm exec` and `npx` respectively.

## 1.2.0 — 2026-02-18

### Changed

- 04-execution: Worker threads now use a lightweight initialization path that reuses
  resolved options from the main thread and only loads config files, skipping project
  resolution, option merging, and task input resolution.

## 1.1.0 — 2026-02-18

### Changed

- 01-task: Task registration now delegates to the active Nadle instance via
  AsyncLocalStorage context instead of a global singleton registry.
- 04-execution: Worker threads cache their Nadle instance per thread lifetime,
  loading config files at most once per worker rather than on every task dispatch.
- 08-configuration-loading: Config files are loaded within an AsyncLocalStorage
  context bound to the active Nadle instance, enabling instance-scoped registration.

## 1.0.1 — 2026-02-16

### Changed

- 01-task: Note that empty (lifecycle-only) tasks suppress the STARTED reporter message
- 13-reporting: Document single-message behavior for empty tasks

## 1.0.0 — 2026-02-15

Initial release of the Nadle specification.

### Added

- 01-task: Task model, registration forms, naming rules, status lifecycle, defineTask()
- 02-task-configuration: dependsOn, env, workingDir, inputs/outputs declarations, group
- 03-scheduling: DAG construction, cycle detection, parallel/sequential modes, Kahn's algorithm
- 04-execution: Worker pool, message protocol, env injection, cancellation, cleanup
- 05-caching: Fingerprinting, cache key, validation flow, storage layout, cache miss reasons
- 06-project: Project model, root detection, package manager detection
- 07-workspace: Workspace identity, dependencies, aliases, config files, fallback resolution
- 08-configuration-loading: Config file resolution, jiti transpilation, option precedence
- 09-cli: Commands, flags, handler chain, exit codes, interactive selection
- 10-builtin-tasks: ExecTask, PnpmTask, CopyTask, DeleteTask
- 11-events: Listener interface, event lifecycle, built-in listeners
- 12-error-handling: NadleError, error propagation, known error types
- 13-reporting: Footer renderer, task status messages, execution result, summary
- README: Index, concept dependency map, glossary
