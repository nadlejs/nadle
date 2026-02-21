# Spec Changelog

All notable changes to the Nadle specification are documented in this file.

Versioning follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Backward-incompatible behavioral change, removed concept, or redefined contract
- **MINOR**: New concept, new section, or materially expanded rules
- **PATCH**: Clarifications, corrections, wording improvements

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
