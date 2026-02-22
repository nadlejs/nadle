# 09 — CLI Interface

Nadle is invoked from the command line as `nadle [tasks...] [options]`.

## Command Structure

```
nadle [tasks...] [options]
```

- `tasks` — zero or more task names or task identifiers to execute.
- If no tasks are specified and stdin is a TTY, Nadle enters interactive task selection.

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
| `--show-config`     |       | boolean  | `false` | Print the resolved configuration.                                   |
| `--config-key`      |       | string   |         | Path to a specific config value (dot/bracket notation).             |
| `--stacktrace`      |       | boolean  | `false` | Print full stacktrace on error.                                     |

### General Options

| Flag            | Alias | Type    | Default                        | Description                                              |
| --------------- | ----- | ------- | ------------------------------ | -------------------------------------------------------- |
| `--config`      | `-c`  | string  | `nadle.config.{js,mjs,ts,mts}` | Path to config file.                                     |
| `--cache-dir`   |       | string  | `<projectDir>/.nadle`          | Directory to store cache results.                        |
| `--log-level`   |       | string  | `"log"`                        | Logging level. Choices: `error`, `log`, `info`, `debug`. |
| `--min-workers` |       | string  | `availableParallelism - 1`     | Minimum workers (integer or percentage).                 |
| `--max-workers` |       | string  | `availableParallelism - 1`     | Maximum workers (integer or percentage).                 |
| `--footer`      |       | boolean | `!isCI && isTTY`               | Enable the live progress footer during execution.        |
| `--summary`     |       | boolean | `false`                        | Print a task execution summary at the end of the run.    |

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
| 4        | **DryRun**         | `--dry-run` is `true`            |
| 5        | **ShowConfig**     | `--show-config` is `true`        |
| 6        | **Execute**        | Always matches (default handler) |

Each handler is instantiated and its `canHandle()` method is checked. The first handler
that returns `true` has its `handle()` method invoked. Only one handler runs per
invocation.

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
