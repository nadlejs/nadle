# 10 — Built-in Task Types

Nadle provides twelve built-in reusable task types, all created via `defineTask()`.

## ExecTask

Executes an arbitrary external command.

### Options

| Field     | Type                       | Required | Description                                                                                 |
| --------- | -------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `command` | string                     | Yes      | The command to execute.                                                                     |
| `args`    | string or array of strings | No       | Arguments for the command. If a string, it is parsed into arguments by splitting on spaces. |

### Behavior

1. Parse arguments (string arguments are split into an array).
2. Spawn the process with the command and arguments.
3. Set working directory to the task's `workingDir`.
4. Force color output in the subprocess (`FORCE_COLOR=1`).
5. Stream all subprocess output (stdout and stderr combined) to the task logger.
6. Await subprocess completion.

## PnpmTask

Executes a pnpm command. Specialized variant of ExecTask with `pnpm` as the command.

### Options

| Field    | Type                       | Required | Description                                                          |
| -------- | -------------------------- | -------- | -------------------------------------------------------------------- |
| `args`   | string or array of strings | Yes      | Arguments to pass to `pnpm`.                                         |
| `filter` | string or array of strings | No       | Workspace package(s) to scope the command to, as `--filter` flag(s). |

### Behavior

1. Normalize `filter` to an array and expand each value into a `--filter <value>` pair.
2. Normalize `args` to an array and append it after the filter flags.
3. Spawn `pnpm` with the combined arguments.
4. Set working directory to the task's `workingDir`.
5. Force color output (`FORCE_COLOR=1`).
6. Stream combined output to the task logger.
7. Await subprocess completion.

## NodeTask

Executes a Node.js script. Specialized variant of ExecTask with `node` as the command.

### Options

| Field    | Type                       | Required | Description                     |
| -------- | -------------------------- | -------- | ------------------------------- |
| `script` | string                     | Yes      | The script to execute via node. |
| `args`   | string or array of strings | No       | Arguments for the script.       |

### Behavior

1. Normalize arguments to an array.
2. Spawn `node <script> <args>`.
3. Set working directory to the task's `workingDir`.
4. Force color output (`FORCE_COLOR=1`).
5. Stream combined output to the task logger.
6. Await subprocess completion.

## NpmTask

Executes an npm command. Specialized variant of ExecTask with `npm` as the command.

### Options

| Field  | Type                       | Required | Description                 |
| ------ | -------------------------- | -------- | --------------------------- |
| `args` | string or array of strings | Yes      | Arguments to pass to `npm`. |

### Behavior

1. Normalize arguments to an array.
2. Spawn `npm` with the arguments.
3. Set working directory to the task's `workingDir`.
4. Force color output (`FORCE_COLOR=1`).
5. Stream combined output to the task logger.
6. Await subprocess completion.

## PnpxTask

Executes a locally-installed package binary via `pnpm exec`. Specialized variant of ExecTask
for running binaries from `node_modules/.bin` through pnpm.

### Options

| Field     | Type                       | Required | Description                             |
| --------- | -------------------------- | -------- | --------------------------------------- |
| `command` | string                     | Yes      | The command to execute via `pnpm exec`. |
| `args`    | string or array of strings | No       | Arguments for the command.              |

### Behavior

1. Normalize arguments to an array.
2. Spawn `pnpm exec <command> <args>`.
3. Set working directory to the task's `workingDir`.
4. Force color output (`FORCE_COLOR=1`).
5. Stream combined output to the task logger.
6. Await subprocess completion.

## NpxTask

Executes a locally-installed package binary via `npx`. Specialized variant of ExecTask
for running binaries from `node_modules/.bin` through npx.

### Options

| Field     | Type                       | Required | Description                       |
| --------- | -------------------------- | -------- | --------------------------------- |
| `command` | string                     | Yes      | The command to execute via `npx`. |
| `args`    | string or array of strings | No       | Arguments for the command.        |

### Behavior

1. Normalize arguments to an array.
2. Spawn `npx <command> <args>`.
3. Set working directory to the task's `workingDir`.
4. Force color output (`FORCE_COLOR=1`).
5. Stream combined output to the task logger.
6. Await subprocess completion.

## File Selections

File-operation tasks share one source vocabulary. A **file selection** is either:

- a **string** — a path (relative to the working directory) to a file or a directory, or
- a **selector object** — `{ dir, include?, exclude? }`, where `include`/`exclude` are glob
  patterns matched against files inside `dir` (include defaults to all files).

A string selection pointing to a file yields that file. One pointing to a directory selects
the files inside it (applying the task-level default `include`/`exclude` patterns, if any).
A missing source logs a warning and yields nothing — unless the task's `strict` option is
set, in which case it is an error.

## CopyTask

Copies files into a destination directory.

### Options

| Field       | Type                            | Required | Description                                                                |
| ----------- | ------------------------------- | -------- | -------------------------------------------------------------------------- |
| `from`      | file selection or array thereof | Yes      | Source files, directories, or selectors.                                   |
| `into`      | string                          | Yes      | Destination directory (relative to working directory). Created if missing. |
| `include`   | string or array of strings      | No       | Default include patterns for directory selections without their own.       |
| `exclude`   | string or array of strings      | No       | Default exclude patterns for directory selections without their own.       |
| `flatten`   | boolean                         | No       | Copy all files directly into `into`, dropping source directory structure.  |
| `rename`    | record of string to string      | No       | Renames by exact base name, e.g. `{ "config.dev.json": "config.json" }`.   |
| `overwrite` | `replace` \| `skip` \| `error`  | No       | Behavior when a destination file exists. Default: `replace`.               |
| `strict`    | boolean                         | No       | Fail when a source is missing or nothing matches. Default: `false`.        |

### Behavior

1. Resolve all `from` selections to files (see File Selections).
2. Compute each file's destination: its selection-relative path under `into`, flattened to
   the base name when `flatten` is set, then renamed when its base name appears in `rename`.
3. If two source files map to the same destination, the task fails.
4. Apply the `overwrite` policy per existing destination file: `replace` overwrites,
   `skip` logs and skips, `error` fails the task.
5. Create parent directories as needed and copy.

## MoveTask

Moves files into a destination directory. Identical options and destination-mapping
behavior to CopyTask (including `flatten`, `rename`, `overwrite`, `strict`), with one
difference: each source file is removed after it reaches its destination.

- A filesystem rename is used when possible; cross-device moves fall back to
  copy-then-delete.
- Files skipped by the `overwrite` policy keep their source.
- Emptied source directories are not removed.

## SyncTask

Mirrors sources into a destination directory. Identical selection and
destination-mapping behavior to CopyTask (including `flatten`, `rename`, `strict`),
without an `overwrite` option — existing destination files are always replaced.

### Additional option

| Field      | Type                       | Required | Description                                                 |
| ---------- | -------------------------- | -------- | ----------------------------------------------------------- |
| `preserve` | string or array of strings | No       | Glob patterns (relative to `into`) for files never deleted. |

### Behavior

1. Resolve and copy as CopyTask (always replacing).
2. Delete every file under `into` that does not correspond to a source and does not
   match a `preserve` pattern.
3. Prune directories left empty.

The destination ends up containing exactly the selected files (plus preserved ones).

## ZipTask

Creates a zip archive from selected files.

### Options

| Field     | Type                            | Required | Description                                                          |
| --------- | ------------------------------- | -------- | -------------------------------------------------------------------- |
| `from`    | file selection or array thereof | Yes      | Source files, directories, or selectors (see File Selections).       |
| `archive` | string                          | Yes      | Path of the archive to create (relative to working directory).       |
| `prefix`  | string                          | No       | Entry-name prefix; files are stored as `<prefix>/<relative path>`.   |
| `include` | string or array of strings      | No       | Default include patterns for directory selections without their own. |
| `exclude` | string or array of strings      | No       | Default exclude patterns for directory selections without their own. |
| `strict`  | boolean                         | No       | Fail when a source is missing or nothing matches. Default: `false`.  |

Entry names are the selection-relative paths (always with forward slashes). Two sources
mapping to the same entry name fail the task. Parent directories of the archive are
created as needed.

## UnzipTask

Extracts a zip archive into a directory.

### Options

| Field     | Type                       | Required | Description                                                     |
| --------- | -------------------------- | -------- | --------------------------------------------------------------- |
| `archive` | string                     | Yes      | Path of the archive to extract (relative to working directory). |
| `into`    | string                     | Yes      | Destination directory. Created if missing.                      |
| `include` | string or array of strings | No       | Glob patterns selecting which entries to extract. Default: all. |

A missing archive is an error. Entries whose names would escape the destination
directory (path traversal) fail the task.

## DeleteTask

Deletes files and directories using glob patterns.

### Options

| Field          | Type                       | Required | Description                                             |
| -------------- | -------------------------- | -------- | ------------------------------------------------------- |
| `paths`        | string or array of strings | Yes      | Glob patterns for files/directories to delete.          |
| _(additional)_ |                            | No       | All options supported by the underlying rimraf library. |

### Behavior

1. Expand glob patterns against the working directory.
2. Log the matched paths.
3. Delete all matched paths using rimraf (recursive, handles non-empty directories).

## Common Properties

All built-in tasks share these characteristics:

- They all respect the `workingDir` from the runner context.
- ExecTask, NodeTask, NpmTask, NpxTask, PnpmTask, and PnpxTask force color output via `FORCE_COLOR=1` environment variable.
- ExecTask, NodeTask, NpmTask, NpxTask, PnpmTask, and PnpxTask append the runner context's
  passthrough arguments (CLI args after `--`, see spec 09) after their configured arguments.
  CopyTask and DeleteTask ignore passthrough arguments.
- All tasks stream output through the task logger.

## Custom Task Types

Users create custom reusable task types using `defineTask()`:

```
defineTask({
  run: ({ options, context }) => { ... }
})
```

The `run` function receives typed options and a runner context. The returned task
object is then registered with `tasks.register(name, taskObject, optionsResolver)`.
