# Nadle Specification

**Version**: 1.6.0

This directory contains the language-agnostic specification for Nadle, a type-safe,
Gradle-inspired task runner for Node.js.

## Purpose

This specification is the single source of truth for Nadle's behavior. It describes
concepts, rules, and contracts in plain English without referencing any specific
programming language. It is intended for:

- **Implementors** porting Nadle to another language or runtime
- **Contributors** verifying that behavior matches the spec
- **Testers** writing assertions grounded in documented rules

## How to Read

- **Sequential**: files are numbered so newcomers can read them in order.
- **By reference**: jump to the file covering the concept you need.

## Concept Dependency Map

```
Task (01) --> Configuration (02) --> Scheduling (03) --> Execution (04) --> Caching (05)
                                          ^
Project (06) --> Workspace (07)           |
                                          |
Configuration Loading (08) ---------------+
                                          |
CLI (09) ---------------------------------+

Built-in Tasks (10)
Events (11)
Error Handling (12)
Reporting (13)
```

## Files

| #   | File                                                       | Concept                                                                        |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 01  | [01-task.md](01-task.md)                                   | Task model, registration, naming, status lifecycle                             |
| 02  | [02-task-configuration.md](02-task-configuration.md)       | dependsOn, env, workingDir, inputs, outputs, group                             |
| 03  | [03-scheduling.md](03-scheduling.md)                       | DAG, dependency resolution, cycle detection, execution order                   |
| 04  | [04-execution.md](04-execution.md)                         | Worker pool, message protocol, env injection, cancellation                     |
| 05  | [05-caching.md](05-caching.md)                             | Fingerprinting, cache key, validation flow, storage layout                     |
| 06  | [06-project.md](06-project.md)                             | Project model, root detection, package manager                                 |
| 07  | [07-workspace.md](07-workspace.md)                         | Workspace identity, dependencies, aliases, config files                        |
| 08  | [08-configuration-loading.md](08-configuration-loading.md) | Config file resolution, option precedence, defaults                            |
| 09  | [09-cli.md](09-cli.md)                                     | Commands, flags, handler chain, exit codes                                     |
| 10  | [10-builtin-tasks.md](10-builtin-tasks.md)                 | ExecTask, NodeTask, NpmTask, NpxTask, PnpmTask, PnpxTask, CopyTask, DeleteTask |
| 11  | [11-events.md](11-events.md)                               | Listener interface, event lifecycle                                            |
| 12  | [12-error-handling.md](12-error-handling.md)               | NadleError, error propagation, exit codes                                      |
| 13  | [13-reporting.md](13-reporting.md)                         | Footer renderer, summary output                                                |

## Versioning

This spec follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Backward-incompatible behavioral change, removed concept, or redefined contract
- **MINOR**: New concept, new section, or materially expanded rules
- **PATCH**: Clarifications, corrections, wording improvements

All changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Relationship to User-Facing Docs

This spec defines the internal behavioral contract. The user-facing documentation lives in
`packages/docs/` (the Docusaurus site at nadle.dev). When a spec change is significant to
users — new feature, changed behavior, new CLI flag, breaking change — the corresponding
user-facing docs should also be updated.

## Glossary

| Term                 | Definition                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Task**             | A named unit of work with an optional function and optional typed options.                                             |
| **Workspace**        | A directory within the project that can register its own tasks.                                                        |
| **Project**          | The top-level container: a root workspace, zero or more child workspaces, and a detected package manager.              |
| **Declaration**      | A file or directory pattern used to describe task inputs or outputs.                                                   |
| **Fingerprint**      | A SHA-256 hash of a file's contents, used for cache key computation.                                                   |
| **Cache Key**        | A hash derived from task ID, input fingerprints, and task environment.                                                 |
| **DAG**              | Directed Acyclic Graph representing task dependencies.                                                                 |
| **Listener**         | An object with optional methods for lifecycle events.                                                                  |
| **Handler**          | A command handler (List, DryRun, Execute, etc.) selected by the CLI.                                                   |
| **Runner Context**   | The logger and working directory provided to every task function.                                                      |
| **Kernel**           | Shared zero-dependency package (`@nadle/kernel`) providing workspace identity, task identifiers, and alias resolution. |
| **Project Resolver** | Package (`@nadle/project-resolver`) that discovers projects, scans workspaces, and resolves dependencies.              |
