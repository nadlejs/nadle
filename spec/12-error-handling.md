# 12 — Error Handling

## NadleError

NadleError is a specialized error class with a numeric exit code.

| Property    | Type   | Default        | Description                                                   |
| ----------- | ------ | -------------- | ------------------------------------------------------------- |
| `message`   | string | _(required)_   | Human-readable error message.                                 |
| `errorCode` | number | `1`            | Process exit code used when this error reaches the top level. |
| `name`      | string | `"NadleError"` | Error name for stack traces.                                  |

## Error Propagation

Errors flow through the system in this chain:

```
Task function throws
  -> Worker promise rejects
    -> Pool catches the error
      -> onTaskFailed event emitted
        -> Error re-thrown to handler
          -> onExecutionFailed event emitted
            -> Process exits with error code
```

### Step-by-step

1. A task function throws an error.
2. The worker's default export promise rejects.
3. The pool's `pushTask` method catches the rejection.
4. If the error is a worker termination (cancellation), `onTaskCanceled` is emitted
   and the error is swallowed.
5. Otherwise, `onTaskFailed` is emitted and the error is re-thrown.
6. The re-thrown error propagates to the `execute()` method.
7. `onExecutionFailed` is emitted with the error.
8. The process exits with the appropriate code.

## Exit Code Determination

```
if error is NadleError:
  exit with error.errorCode
else:
  exit with 1
```

## Known Error Types

| Error                             | Message Pattern                                                                                                                         | When Raised                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Cycle detected                    | `"Cycle detected in task {path}. Please resolve the cycle before executing tasks."`                                                     | During scheduling, before execution.               |
| Duplicate task name               | `"Task {name} already registered in workspace {id}"`                                                                                    | During task registration.                          |
| Invalid task name                 | `"Invalid task name: {name}. Task names must contain only letters, numbers, and dashes; start with a letter, and not end with a dash."` | During task registration.                          |
| Config file not found             | `"No nadle.config.{...} found in {path} directory or parent directories."`                                                              | During config resolution.                          |
| Task not found                    | `"Task {name} not found in {workspace} workspace."`                                                                                     | During task resolution.                            |
| Task not found (with suggestions) | `"Task {name} not found in {workspace} nor {fallback} workspace. {suggestions}"`                                                        | During task resolution with fallback.              |
| Invalid worker config             | `"Invalid value for --{min/max}-workers. Expect to be an integer or a percentage."`                                                     | During CLI option parsing.                         |
| Invalid configure usage           | `"configure function can only be called from the root workspace."`                                                                      | When `configure()` called from non-root workspace. |
| Workspace not found               | `"Workspace {input} not found. Available workspaces: {list}."`                                                                          | During workspace resolution.                       |
| Empty workspace label             | `"Workspace {id} alias can not be empty."`                                                                                              | During alias validation.                           |
| Duplicate workspace label         | `"Workspace {id} has a duplicated label {label} with workspace {other}."`                                                               | During alias validation.                           |

## Stacktrace Display

By default, only the error message is shown. When `--stacktrace` is passed:

- The full error stack trace is printed.
- Without `--stacktrace`, a hint is shown suggesting the user re-run with the flag.
