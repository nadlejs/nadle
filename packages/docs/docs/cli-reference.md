---
description: Complete machine-readable reference of every Nadle CLI flag, its alias, type, default, and description, generated from source.
keywords: [nadle, CLI, flags, options, reference, command line, task runner]
---

# CLI Reference

This page lists every Nadle command-line flag. It is generated from Nadle's source
(`packages/nadle/src/core/options/cli-options.ts`), so it always matches the installed version.

## Usage

```bash
nadle [tasks...] [options]
```

- `tasks...` — One or more task names to run, in order. Task names are positional arguments.
  A task may be a bare name (`build`) or workspace-qualified (`docs:build`).
- `options` — Any of the flags listed below.
- `--` — Everything after a bare `--` is passed through verbatim to the underlying task
  (for example `nadle test -- --watch` forwards `--watch` to the test runner).

## Flags

| Flag                | Type                                  | Default                                  | Description                                                                                              |
| ------------------- | ------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `--config`, `-c`    | string                                | `<cwd>/nadle.config.{js,mjs,ts,mts}`     | Path to config file                                                                                      |
| `--list`, `-l`      | boolean                               | `false`                                  | List all available tasks                                                                                 |
| `--list-workspaces` | boolean                               | `false`                                  | List all available workspaces                                                                            |
| `--parallel`        | boolean                               | `false`                                  | Run all specified tasks in parallel regardless of their order, while still respecting task dependencies. |
| `--dry-run`, `-m`   | boolean                               | `false`                                  | Run specified tasks in dry run mode                                                                      |
| `--watch`, `-w`     | boolean                               | `false`                                  | Re-run the requested tasks when their inputs change                                                      |
| `--graph`           | (empty) \| `tree` \| `mermaid`        | —                                        | Print the task dependency graph instead of executing (tree or mermaid)                                   |
| `--explain`         | string                                | —                                        | Explain why a task runs, what depends on it, and its inputs, instead of executing                        |
| `--since`           | string                                | —                                        | Run only the requested tasks affected by changes since the given git ref                                 |
| `--why`             | boolean                               | `false`                                  | Explain each task's cache outcome (hit/miss and what changed)                                            |
| `--stacktrace`      | boolean                               | `false`                                  | Print stacktrace on error                                                                                |
| `--show-config`     | boolean                               | `false`                                  | Print the resolved configuration                                                                         |
| `--config-key`      | string                                | `undefined`                              | Path to a specific resolved configuration value, using dot/bracket notation                              |
| `--footer`          | boolean                               | `!isCI && isTTY`                         | Enables the in-progress summary footer during task execution                                             |
| `--reporter`        | `default` \| `agent`                  | `default`                                | Output reporter: 'default' (human) or 'agent' (compact, plain, for agents/scripts)                       |
| `--no-cache`        | boolean                               | `false`                                  | Disable task caching. All tasks will be executed and their results will not be stored                    |
| `--cache-dir`       | string                                | `<projectDir>/node_modules/.cache/nadle` | Directory to store task cache results                                                                    |
| `--clean-cache`     | boolean                               | `false`                                  | Deletes all files in the cache directory. Can be used with --cache-dir to specify a custom location      |
| `--summary`         | boolean                               | `false`                                  | Print a summary of executed tasks at the end of the run                                                  |
| `--exclude`, `-x`   | string[]                              | —                                        | Tasks to exclude from execution                                                                          |
| `--log-level`       | `error` \| `log` \| `info` \| `debug` | `log`                                    | Set the logging level                                                                                    |
| `--min-workers`     | string                                | `Os.availableParallelism() - 1`          | Minimum number of workers (integer or percentage)                                                        |
| `--max-workers`     | string                                | `Os.availableParallelism() - 1`          | Maximum number of workers (integer or percentage)                                                        |
