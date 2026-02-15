# 08 — Configuration Loading

Nadle configuration is loaded from config files, merged with CLI options, and resolved
to a final set of options.

## Supported Formats

Config files may use any of these extensions:

| Extension | Module Format                                               |
| --------- | ----------------------------------------------------------- |
| `.js`     | CommonJS or ESM (detected from `package.json` `type` field) |
| `.mjs`    | ESM                                                         |
| `.ts`     | TypeScript (transpiled at runtime)                          |
| `.mts`    | TypeScript ESM (transpiled at runtime)                      |

## Default Config File

The default config file name is `nadle.config.ts`. Nadle searches for config files in
this precedence order:

1. `nadle.config.js`
2. `nadle.config.ts`
3. `nadle.config.mjs`
4. `nadle.config.mts`

If multiple exist, the first match wins (JS before TS, TS before MTS).

The `--config` flag overrides this search and specifies an explicit path.

## Runtime Transpilation

Config files are loaded using `jiti`, which provides:

- ESM support regardless of the project's module format.
- TypeScript transpilation without a separate build step.
- Interop for default exports.

## Loading Flow

1. **CLI parse**: yargs parses command-line arguments.
2. **Config file resolution**: find and load the root config file.
3. **Root config execution**: the config file runs, calling `tasks.register()` and
   optionally `configure()`.
4. **Workspace config loading**: for each workspace with a config file, set the
   workspace context and load the file.
5. **Project resolution**: resolve project structure, workspaces, and dependencies.
6. **Task finalization**: flush the task registry buffer into the final registry.
7. **Options merge**: combine defaults, file options, and CLI options.

## The `configure()` Function

The `configure()` function may be called from the **root config file only**. It sets
file-level options that are merged between defaults and CLI options.

Accepted options:

| Option       | Type               | Description                                                             |
| ------------ | ------------------ | ----------------------------------------------------------------------- |
| `alias`      | object or function | Workspace alias configuration (see [07-workspace.md](07-workspace.md)). |
| `cache`      | boolean            | Enable or disable caching.                                              |
| `cacheDir`   | string             | Custom cache directory path.                                            |
| `footer`     | boolean            | Enable or disable the live footer.                                      |
| `logLevel`   | string             | Log level (`"error"`, `"log"`, `"info"`, `"debug"`).                    |
| `parallel`   | boolean            | Enable parallel execution mode.                                         |
| `minWorkers` | number or string   | Minimum worker thread count.                                            |
| `maxWorkers` | number or string   | Maximum worker thread count.                                            |

If `configure()` is called from a non-root workspace config file, it raises an error.

## Option Precedence

Options are merged in this order (later wins):

```
Built-in defaults < File options (configure()) < CLI flags
```

## Built-in Defaults

| Option       | Default                                 |
| ------------ | --------------------------------------- |
| `cache`      | `true`                                  |
| `footer`     | `true` (but `false` in CI environments) |
| `parallel`   | `false`                                 |
| `logLevel`   | `"log"`                                 |
| `summary`    | `false`                                 |
| `cleanCache` | `false`                                 |
| `minWorkers` | `availableParallelism - 1`              |
| `maxWorkers` | `availableParallelism - 1`              |

## Worker Count Resolution

Worker count values can be:

- An integer: used directly.
- A percentage string (e.g., `"50%"`): multiplied by `availableParallelism` and rounded.

The result is always clamped to `[1, availableParallelism]`. The `minWorkers` value is
additionally capped at `maxWorkers`.

## Supported Log Levels

The following log levels are supported, in increasing verbosity:

1. `"error"` — errors only
2. `"log"` — standard output (default)
3. `"info"` — informational messages
4. `"debug"` — debug-level output
