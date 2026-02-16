# 01 — Task Model

A **task** is the fundamental unit of work in Nadle. Each task has a name, belongs to a
workspace, and may carry a function to execute and typed options.

## Registration

Tasks are registered via the `tasks` API, which is available from the public API. During
config file loading, calls to `tasks.register()` delegate to the active Nadle instance
via an `AsyncLocalStorage` context. Each Nadle instance owns its own task registry,
ensuring full isolation between instances. There are three registration forms:

| Form       | Parameters                              | Description                                                                                             |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| No-op      | `name`                                  | Registers a lifecycle-only task with no function body. Useful as an aggregation point for dependencies. |
| Function   | `name`, `taskFn`                        | Registers a task with a function that receives a runner context.                                        |
| Typed task | `name`, `taskObject`, `optionsResolver` | Registers a reusable task type with typed options and a resolver.                                       |

All three forms return a **configuration builder** that exposes a `.config()` method
(see [02-task-configuration.md](02-task-configuration.md)).

### Task Function Signature

A task function receives an object with:

- `context` — the runner context (see below)

A typed task's `run` function receives:

- `options` — the resolved options for this task instance
- `context` — the runner context

Both must return void (or a promise of void).

### Runner Context

Every task function receives a runner context containing:

| Field        | Description                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `logger`     | A structured logger with methods: `log`, `warn`, `info`, `error`, `debug`, `throw`, `getColumns`. |
| `workingDir` | The resolved absolute working directory for this task.                                            |

## Naming Rules

Task names must match the pattern: `^[a-z]([a-z0-9-]*[a-z0-9])?$` (case-insensitive).

Rules:

- Must start with a letter.
- May contain letters, digits, and hyphens.
- Must not end with a hyphen.
- Must not be empty.
- Must not start with a digit.

If a task name is invalid, registration fails with an error.

## Duplicate Detection

Task names must be unique **within a workspace**. The same name may appear in different
workspaces. If a duplicate name is registered in the same workspace, registration fails
with an error.

## Task Identity

A task is uniquely identified by a **task identifier** string:

| Scope           | Format                     | Example              |
| --------------- | -------------------------- | -------------------- |
| Root workspace  | `{taskName}`               | `build`              |
| Child workspace | `{workspaceId}:{taskName}` | `packages:foo:build` |

The separator is a colon (`:`). The last segment is always the task name; preceding
segments form the workspace ID.

## Status Lifecycle

A task moves through the following statuses:

```
                                    +-> Finished
                                    |
Registered -> Scheduled -> Running -+-> Failed
                  |                 |
                  |                 +-> Canceled
                  |
                  +-> UpToDate
                  |
                  +-> FromCache
```

| Status     | Value          | Meaning                                                            |
| ---------- | -------------- | ------------------------------------------------------------------ |
| Registered | `"registered"` | Task is registered but not yet scheduled.                          |
| Scheduled  | `"scheduled"`  | Task is included in the execution plan.                            |
| Running    | `"running"`    | Task function is currently executing in a worker.                  |
| Finished   | `"finished"`   | Task function completed successfully.                              |
| UpToDate   | `"up-to-date"` | Cache validation determined outputs are current; task was skipped. |
| FromCache  | `"from-cache"` | Outputs were restored from cache; task was skipped.                |
| Failed     | `"failed"`     | Task function threw an error.                                      |
| Canceled   | `"canceled"`   | Worker was terminated before the task completed.                   |

### Transition Rules

- **UpToDate** and **FromCache** are entered directly from Scheduled, without passing
  through Running. These tasks never emit a "start" event.
- Only tasks in Running can transition to Finished, Failed, or Canceled.
- The Running counter is only decremented for Finished, Failed, and Canceled transitions
  (not for UpToDate or FromCache).
- **Empty (lifecycle-only) tasks** still transition through Running and emit start/finish
  events, but the reporter suppresses the STARTED message — only DONE is printed.
  See [13-reporting.md](13-reporting.md) for details.

## Reusable Task Types

The `defineTask()` function creates a reusable task type with a typed options contract.
It is an identity function that enables type inference for the `run` function's `options`
parameter.

A reusable task type is then registered with `tasks.register(name, taskObject, resolver)`
where the resolver provides the concrete options for this instance.
