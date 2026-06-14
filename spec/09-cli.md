# 09 — CLI Interface

Nadle is invoked from the command line as `nadle [tasks...] [options]`.

## Command Structure

```
nadle [tasks...] [options]
```

- `tasks` — zero or more task names or task identifiers to execute.
- If no tasks are specified and stdin is a TTY, Nadle enters interactive task selection.

### Glob Task Selection

A task name (the name segment, after any workspace qualifier) may be a glob pattern — any input
containing `*`, `?`, `[`, `]`, `{`, `}`, or `!`. Patterns are matched against the registered task
names of the resolved workspace:

- An unqualified pattern (e.g. `build*`) matches task names in the target workspace; if none match
  there, the root workspace is tried as a fallback.
- A workspace-qualified pattern (e.g. `backend:build*`) matches only within that workspace.
- A pattern that matches no task is an error (exit code 3) — patterns never silently expand to
  nothing.

Glob patterns apply equally to the `--exclude` option. Because task names never contain glob
characters, an input is treated as a glob if and only if it contains one.

### Argument Passthrough

Arguments after the first bare `--` are not parsed as Nadle options; they are captured
verbatim and passed through to tasks.

```
nadle <tasks...> [options] -- <args...>
```

Rules:

- Passthrough arguments are delivered only to tasks explicitly requested on the command
  line (including tasks matched by a glob pattern). Dependency tasks never receive them.
- Every requested task receives the same arguments. When more than one requested task
  will receive arguments, an informational notice is logged.
- Task runners access the arguments via the runner context (`passthroughArgs`).
  Exec-based builtin tasks append them to their underlying command.
- Passthrough arguments participate in the cache key of requested tasks; an invocation
  with arguments is never served from a cache entry produced without them. Dependency
  task cache keys are unaffected.
- Strict option parsing still applies before `--`: unknown Nadle flags remain an error.
- Dry run annotates requested tasks with the arguments they would receive.

## Flags

### Execution Options

| Flag                | Alias | Type     | Default | Description                                                           |
| ------------------- | ----- | -------- | ------- | --------------------------------------------------------------------- |
| `--parallel`        |       | boolean  | `false` | Run all specified tasks in parallel while respecting dependencies.    |
| `--exclude`         | `-x`  | string[] |         | Tasks to exclude from execution. Supports comma-separated values.     |
| `--no-cache`        |       | boolean  | `false` | Disable task caching. All tasks execute and results are not stored.   |
| `--clean-cache`     |       | boolean  | `false` | Delete all files in the cache directory.                              |
| `--list`            | `-l`  | boolean  | `false` | List all available tasks.                                             |
| `--list-workspaces` |       | boolean  | `false` | List all available workspaces.                                        |
| `--dry-run`         | `-m`  | boolean  | `false` | Show execution plan without running tasks.                            |
| `--watch`           | `-w`  | boolean  | `false` | Re-run the requested tasks when their declared inputs change.         |
| `--graph`           |       | string   | `tree`  | Print the dependency graph instead of executing. `tree`/`mermaid`.    |
| `--explain`         |       | string   |         | Explain a single task (why it runs, dependents, inputs); no run.      |
| `--since`           |       | string   |         | Run only the requested tasks affected by changes since a git ref.     |
| `--show-config`     |       | boolean  | `false` | Print the resolved configuration.                                     |
| `--config-key`      |       | string   |         | Path to a specific config value (dot/bracket notation).               |
| `--json`            |       | boolean  | `false` | Emit machine-readable JSON from read commands instead of human text.  |
| `--doctor`          |       | boolean  | `false` | Diagnose project, config, and cache health; no execution.             |
| `--capabilities`    |       | boolean  | `false` | Emit a machine-readable JSON description of flags, tasks, and config. |
| `--stacktrace`      |       | boolean  | `false` | Print full stacktrace on error.                                       |

### General Options

| Flag            | Alias | Type    | Default                                  | Description                                                                               |
| --------------- | ----- | ------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `--config`      | `-c`  | string  | `nadle.config.{js,mjs,ts,mts}`           | Path to config file.                                                                      |
| `--cache-dir`   |       | string  | `<projectDir>/node_modules/.cache/nadle` | Directory to store cache results.                                                         |
| `--log-level`   |       | string  | `"log"`                                  | Logging level. Choices: `error`, `log`, `info`, `debug`.                                  |
| `--reporter`    |       | string  | `"default"`                              | Output reporter: a built-in (`default`/`agent`) or a plugin-registered reporter name.     |
| `--min-workers` |       | string  | `availableParallelism - 1`               | Minimum workers (integer or percentage).                                                  |
| `--max-workers` |       | string  | `availableParallelism - 1`               | Maximum workers (integer or percentage).                                                  |
| `--footer`      |       | boolean | `!isCI && isTTY`                         | Enable the live progress footer during execution.                                         |
| `--summary`     |       | boolean | `false`                                  | Print profiling insights at the end: slow-task table, critical path, cache-miss hotspots. |
| `--why`         |       | boolean | `false`                                  | Explain each task's cache outcome (hit/miss and changes).                                 |

### Miscellaneous

| Flag        | Alias | Description          |
| ----------- | ----- | -------------------- |
| `--help`    | `-h`  | Show help.           |
| `--version` | `-v`  | Show version number. |

## Shell Completion

The `completion` command prints a shell completion script to standard output for the
detected shell (bash, zsh, or fish). The user installs it by sourcing the output
(e.g. `nadle completion >> ~/.zshrc`).

Once installed, pressing TAB completes:

- **task names** — the labels of all tasks registered by the live configuration
  (discovered by loading the config, exactly as `--list` does), and
- **option flags** — the known CLI flags.

Completion discovers task names dynamically from the current project, so it always
reflects the tasks actually defined. The completion command and the completion
callback produce no other output (no banner, footer, or logs).

## JSON Output

The `--json` flag switches the read-only inspection commands from human-oriented text to
a single machine-readable JSON document on standard output. It is intended for tooling and
automation that need to parse Nadle's introspection output reliably.

When `--json` is set:

- The selected read command prints exactly one JSON document and nothing else: no banner,
  no progress footer, no colors, and no trailing run summary.
- The live progress footer is forced off regardless of its own default.

`--json` applies to these commands; any other command ignores it:

| Command             | JSON document                                                                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--list`            | An array of task objects, each with `name`, `label`, `group`, `description`, `dependsOn`, `inputs`, `outputs`, and `workspace`.                                                                                         |
| `--list-workspaces` | An array of workspace objects, each with `id`, `label`, and `parent` (the id of the nearest enclosing workspace, or null for the root).                                                                                 |
| `--dry-run`         | An object with the ordered execution `plan`; each entry has the task `id`, `label`, its implicit-dependency ids, and the passthrough arguments it would receive.                                                        |
| `--graph`           | An object describing the dependency graph: the requested `roots` and a `nodes` array, each node with `id`, `label`, explicit `dependencies`, and `implicitDependencies`. The `tree`/`mermaid` format choice is ignored. |
| `--explain`         | An object describing one task: its `label`, whether it was `requestedDirectly`, the `pullPaths` that transitively request it, its `dependents`, declared `inputs`, and whether caching is enabled.                      |

`--show-config` and `--config-key` already emit JSON and are unaffected by `--json`.

A task's `dependsOn`, `inputs`, and `outputs` reflect its declared configuration. `inputs`
and `outputs` are rendered as `<type>: <pattern>` entries (one per declared pattern).

## Handler Chain

After options are resolved, Nadle selects a handler using a **first-match-wins** chain:

| Priority | Handler            | Condition                        |
| -------- | ------------------ | -------------------------------- |
| 1        | **List**           | `--list` is `true`               |
| 2        | **ListWorkspaces** | `--list-workspaces` is `true`    |
| 3        | **CleanCache**     | `--clean-cache` is `true`        |
| 4        | **Graph**          | `--graph` is set                 |
| 5        | **Explain**        | `--explain` is set               |
| 6        | **DryRun**         | `--dry-run` is `true`            |
| 7        | **ShowConfig**     | `--show-config` is `true`        |
| 8        | **Doctor**         | `--doctor` is `true`             |
| 9        | **Capabilities**   | `--capabilities` is `true`       |
| 10       | **Watch**          | `--watch` is `true`              |
| 11       | **Execute**        | Always matches (default handler) |

Each handler is instantiated and its `canHandle()` method is checked. The first handler
that returns `true` has its `handle()` method invoked. Only one handler runs per
invocation.

The **Execute** handler additionally honors `--since <ref>`: before scheduling, it
filters the requested (expanded) task set to those affected by files changed since the
git ref. A task is affected when a changed file lies within its workspace directory;
the dependencies of an affected task are included so its inputs are produced. If no
task is affected, Execute reports it and runs nothing. Cross-workspace dependent
propagation is out of scope for this version.

### Doctor

The **Doctor** handler (`--doctor`) runs a set of read-only diagnostic checks and
prints each as a status line, then a summary. It performs no execution and mutates
nothing. Each check yields one of: **ok**, **warning**, or **error**. The process
exits non-zero if any check is an error (zero if only warnings or all ok).

The checks are:

| Check                | Warning / error condition                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Project              | Reports the detected package manager and workspace count (informational, always ok).       |
| Cache directory      | Warns if the cache directory exists but is not writable.                                   |
| Partial cacheability | Warns for each task that declares `inputs` without `outputs` or vice versa (never cached). |
| Stale outputs        | Warns for each cacheable task whose declared outputs are entirely missing on disk.         |

The set of checks may grow over time; the contract is that Doctor is read-only and
that an error-level finding makes the exit code non-zero.

### Capabilities

The **Capabilities** handler (`--capabilities`) prints a single machine-readable JSON
document describing what this version of Nadle can do, then exits without executing
anything. It is intended for tools and agents that need to discover Nadle's surface
programmatically instead of parsing help text or loading the configuration themselves.

The document is the only output (no banner, footer, or logs) and has the shape:

- `version` — the Nadle version that produced the document.
- `flags` — the full list of recognized CLI flags, each with its `name`, `type`,
  `description`, optional `default`, optional `choices`, and `aliases`. This list is
  **derived from the same definitions that drive option parsing**, so it can never drift
  from the flags Nadle actually accepts. Internal/hidden flags are omitted.
- `tasks` — the tasks discovered from the live configuration (exactly the set `--list`
  would show), each with its identifier, name, label, workspace, and optional `group`
  and `description`.
- `config` — a JSON Schema describing the task configuration object accepted in a
  configuration file (the fields a task may declare, e.g. `dependsOn`, `env`,
  `workingDir`, `inputs`, `outputs`, and caching/retry controls).

Because task discovery loads the configuration, configuration errors surface here as they
would for any other handler; when the configuration loads, the handler always succeeds.

### Handler Interface

All handlers extend a base class with:

- `name` — handler display name for debug logging.
- `description` — human-readable description.
- `canHandle()` — returns `true` if this handler should run.
- `handle()` — performs the handler's action.

## Exit Codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | Success (implicit — Nadle does not explicitly exit on success). |
| `1`  | Unknown error or default NadleError code.                       |
| `N`  | NadleError with a specific `errorCode`.                         |

When an error is caught during execution:

- If the error is a NadleError, exit with its `errorCode`.
- Otherwise, exit with code `1`.

In a machine-readable error mode (see Error Handling — Structured Error Output),
the same failure also emits a one-line structured error record to the error stream
before exiting.

## Interactive Task Selection

When no tasks are specified on the command line and stdin is a TTY, Nadle enters an
interactive mode where the user can select tasks from a list. This state is tracked
internally and affects footer rendering.
