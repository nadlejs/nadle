# 10 — Built-in Task Types

Nadle provides eight built-in reusable task types, all created via `defineTask()`.

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

| Field  | Type                       | Required | Description                  |
| ------ | -------------------------- | -------- | ---------------------------- |
| `args` | string or array of strings | Yes      | Arguments to pass to `pnpm`. |

### Behavior

1. Normalize arguments to an array.
2. Spawn `pnpm` with the arguments.
3. Set working directory to the task's `workingDir`.
4. Force color output (`FORCE_COLOR=1`).
5. Stream combined output to the task logger.
6. Await subprocess completion.

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

## CopyTask

Copies files and directories using glob patterns.

### Options

| Field     | Type                       | Required | Description                                       |
| --------- | -------------------------- | -------- | ------------------------------------------------- |
| `from`    | string                     | Yes      | Source path (relative to working directory).      |
| `to`      | string                     | Yes      | Destination path (relative to working directory). |
| `include` | string or array of strings | No       | Glob patterns to include. Default: `**/*`.        |
| `exclude` | string or array of strings | No       | Glob patterns to exclude. Default: none.          |

### Behavior

**When `from` is a directory:**

1. Create the destination directory.
2. Glob all files matching `include` patterns, ignoring `exclude` patterns.
3. Copy each matched file, preserving relative directory structure.

**When `from` is a file:**

1. Check if the file matches include/exclude patterns.
2. If the destination is a directory (or ends with a path separator), copy into it.
3. Otherwise, copy to the exact destination path.
4. Create parent directories as needed.

If the source path does not exist, a warning is logged and no error is raised.

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
