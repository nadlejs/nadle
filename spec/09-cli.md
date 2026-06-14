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

| Flag                | Alias | Type     | Default | Description                                                         |
| ------------------- | ----- | -------- | ------- | ------------------------------------------------------------------- |
| `--parallel`        |       | boolean  | `false` | Run all specified tasks in parallel while respecting dependencies.  |
| `--exclude`         | `-x`  | string[] |         | Tasks to exclude from execution. Supports comma-separated values.   |
| `--no-cache`        |       | boolean  | `false` | Disable task caching. All tasks execute and results are not stored. |
| `--clean-cache`     |       | boolean  | `false` | Delete all files in the cache directory.                            |
| `--list`            | `-l`  | boolean  | `false` | List all available tasks.                                           |
| `--list-workspaces` |       | boolean  | `false` | List all available workspaces.                                      |
| `--dry-run`         | `-m`  | boolean  | `false` | Show execution plan without running tasks.                          |
| `--watch`           | `-w`  | boolean  | `false` | Re-run the requested tasks when their declared inputs change.       |
| `--graph`           |       | string   | `tree`  | Print the dependency graph instead of executing. `tree`/`mermaid`.  |
| `--explain`         |       | string   |         | Explain a single task (why it runs, dependents, inputs); no run.    |
| `--since`           |       | string   |         | Run only the requested tasks affected by changes since a git ref.   |
| `--show-config`     |       | boolean  | `false` | Print the resolved configuration.                                   |
| `--config-key`      |       | string   |         | Path to a specific config value (dot/bracket notation).             |
| `--stacktrace`      |       | boolean  | `false` | Print full stacktrace on error.                                     |

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
| 8        | **Watch**          | `--watch` is `true`              |
| 9        | **Execute**        | Always matches (default handler) |

Each handler is instantiated and its `canHandle()` method is checked. The first handler
that returns `true` has its `handle()` method invoked. Only one handler runs per
invocation.

The **Execute** handler additionally honors `--since <ref>`: before scheduling, it
filters the requested (expanded) task set to those affected by files changed since the
git ref. A task is affected when a changed file lies within its workspace directory;
the dependencies of an affected task are included so its inputs are produced. If no
task is affected, Execute reports it and runs nothing. Cross-workspace dependent
propagation is out of scope for this version.

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

## Interactive Task Selection

When no tasks are specified on the command line and stdin is a TTY, Nadle enters an
interactive mode where the user can select tasks from a list. This state is tracked
internally and affects footer rendering.
