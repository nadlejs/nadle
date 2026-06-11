# Spec Changelog

All notable changes to the Nadle specification are documented in this file.

Versioning follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Backward-incompatible behavioral change, removed concept, or redefined contract
- **MINOR**: New concept, new section, or materially expanded rules
- **PATCH**: Clarifications, corrections, wording improvements

## 2.3.0 — 2026-06-11

### Added

- 10-builtin-tasks: DownloadTask — HTTP(S) download into a directory with optional
  SHA-256 verification; matching existing files skip the download, mismatches fail
  the task and remove the file.

## 2.2.0 — 2026-06-11

### Added

- 10-builtin-tasks: ZipTask — creates a zip archive from file selections, with an
  optional entry-name `prefix`; duplicate entry names fail the task.
- 10-builtin-tasks: UnzipTask — extracts an archive into a directory, with optional
  `include` entry filtering; path-traversal entries fail the task.

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
