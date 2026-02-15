# 02 — Task Configuration

Every registered task may be configured via a builder pattern. The `.config()` method
accepts either a static configuration object or a callback that returns one.

## Configuration Fields

All fields are optional.

| Field         | Type                                   | Description                                                        |
| ------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `dependsOn`   | string or array of strings             | Tasks that must complete before this task runs.                    |
| `env`         | map of string to string/number/boolean | Environment variables injected into the worker.                    |
| `workingDir`  | string                                 | Working directory for the task, relative to the project root.      |
| `inputs`      | declaration or array of declarations   | File patterns the task reads from. Used for cache fingerprinting.  |
| `outputs`     | declaration or array of declarations   | File patterns the task produces. Used for caching and restoration. |
| `group`       | string                                 | Group label for display in `--list` output only.                   |
| `description` | string                                 | Description for display in `--list` output only.                   |

## Builder Pattern

The configuration builder exposes a single method:

- `config(builderOrObject)` — accepts a static object or a callback returning the object.

Calling `.config()` **replaces** the entire configuration (it does not merge). The last
call wins.

## dependsOn Resolution

Dependency strings are resolved as follows:

1. **No colon** (e.g., `"build"`) — resolved within the current workspace.
2. **With colon** (e.g., `"packages:foo:build"`) — the last segment is the task name;
   preceding segments form the workspace ID. Resolved by workspace ID or label.
3. **Root workspace** — use `"root:taskName"` (root workspace ID is always `"root"`).

If a dependency is not found in the target workspace, Nadle falls back to the root
workspace. If still not found, an error is raised with suggestions.

Excluded tasks (via `--exclude`) are filtered out of the resolved dependency set.

## Declarations DSL

Declarations describe file patterns for inputs and outputs. There are two types:

| Type      | Factory                                                     | Pattern Behavior                                                                                 |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| File      | `Inputs.files(...patterns)` or `Outputs.files(...patterns)` | Each pattern is a file glob resolved against the working directory.                              |
| Directory | `Inputs.dirs(...patterns)` or `Outputs.dirs(...patterns)`   | Each pattern matches directories; all files within matched directories are included recursively. |

`Outputs.files` and `Outputs.dirs` are aliases for `Inputs.files` and `Inputs.dirs`
respectively — there is no functional difference.

### Pattern Resolution

- **Static paths** are resolved relative to the working directory.
- **Glob patterns** are expanded using a glob library with `onlyFiles: true`.
- **Directory declarations** expand to `{pattern}/**/*` to capture all nested files.

## Environment Variables

The `env` field accepts a map of key-value pairs where values may be strings, numbers, or
booleans. Non-string values are converted to strings (via `String(val)`) before being
applied to the worker process environment.

Environment variables are applied before the task function runs and restored to their
original values afterward.

## Working Directory

The `workingDir` field is resolved relative to the project root workspace's absolute path.
If omitted, it defaults to the project root. The resolved absolute path is provided to
the task function via the runner context.
