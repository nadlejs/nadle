# 11 — Event System

Nadle emits lifecycle events via a listener-based event system.

## Listener Interface

A listener is an object with optional methods for each lifecycle event. All event
methods are optional — a listener may implement any subset.

## Events

Events are listed in typical emission order:

| Event                    | Parameters                         | When Emitted                                                            |
| ------------------------ | ---------------------------------- | ----------------------------------------------------------------------- |
| `onInitialize`           | _(none)_                           | After Nadle is initialized, before execution starts.                    |
| `onExecutionStart`       | _(none)_                           | Immediately before the handler chain runs.                              |
| `onTasksScheduled`       | `tasks` (list of registered tasks) | After the scheduler produces the execution plan.                        |
| `onTaskStart`            | `task`, `threadId`                 | When a worker begins executing a task function (after "start" message). |
| `onTaskFinish`           | `task`                             | When a task function completes successfully.                            |
| `onTaskFailed`           | `task`                             | When a task function throws an error.                                   |
| `onTaskCanceled`         | `task`                             | When a worker is terminated while a task is running.                    |
| `onTaskUpToDate`         | `task`                             | When cache validation determines outputs are current.                   |
| `onTaskRestoreFromCache` | `task`                             | When outputs are restored from cache.                                   |
| `onExecutionFinish`      | _(none)_                           | After all tasks complete successfully.                                  |
| `onExecutionFailed`      | `error`                            | When any task fails or an unhandled error occurs.                       |

### Important Notes

- `onTaskStart` is only emitted for tasks that actually execute. Tasks resolved as
  up-to-date or from-cache do **not** receive `onTaskStart`.
- `onExecutionFinish` and `onExecutionFailed` are mutually exclusive — exactly one
  is emitted per run.

## Emission Order

Events are emitted **sequentially** through all registered listeners, in registration
order. For each event:

1. Iterate through all listeners.
2. For each listener that implements the event method, call it and await the result.
3. Move to the next listener.

This means listeners are called in order and each listener's handler completes before
the next is invoked.

## Built-in Listeners

Nadle registers two built-in listeners in this order:

| Order | Listener             | Purpose                                                                          |
| ----- | -------------------- | -------------------------------------------------------------------------------- |
| 1     | **ExecutionTracker** | Aggregates task statistics: counts by status, duration tracking, per-task state. |
| 2     | **DefaultReporter**  | Renders UI output: task start/finish messages, footer, summary.                  |

The ExecutionTracker runs first so that statistics are up-to-date when the
DefaultReporter renders output.

## ExecutionTracker Details

The execution tracker maintains:

- **Task stats**: count of tasks in each status (Scheduled, Running, Finished,
  UpToDate, FromCache, Failed, Canceled).
- **Duration**: total execution time, updated every 100ms via an interval timer.
- **Per-task state**: status, duration, start time, and thread ID for each task.

The duration timer is unreferenced so it does not prevent the process from exiting.

## Custom Listeners

Custom listeners are not directly supported through the public API in the current
implementation. The event emitter is initialized with a fixed set of listeners
(ExecutionTracker and DefaultReporter).
