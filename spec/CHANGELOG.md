# Spec Changelog

All notable changes to the Nadle specification are documented in this file.

Versioning follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Backward-incompatible behavioral change, removed concept, or redefined contract
- **MINOR**: New concept, new section, or materially expanded rules
- **PATCH**: Clarifications, corrections, wording improvements

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
