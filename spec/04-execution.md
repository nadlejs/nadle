# 04 — Execution

Tasks are executed in isolated worker threads managed by a thread pool.

## Worker Pool

The pool is configured with:

| Setting                    | Default                    | Description                           |
| -------------------------- | -------------------------- | ------------------------------------- |
| `minThreads`               | `availableParallelism - 1` | Minimum number of worker threads.     |
| `maxThreads`               | `availableParallelism - 1` | Maximum number of worker threads.     |
| `concurrentTasksPerWorker` | `1`                        | Always one task per worker at a time. |

Worker count values are clamped to `[1, availableParallelism]`. Percentage strings
(e.g., `"50%"`) are multiplied by `availableParallelism` and rounded.

## Worker Parameters

Each task dispatch sends these parameters to the worker:

| Parameter | Description                                                         |
| --------- | ------------------------------------------------------------------- |
| `taskId`  | The task identifier string.                                         |
| `port`    | A MessagePort for sending messages back to the pool.                |
| `env`     | The original process environment at dispatch time.                  |
| `options` | The fully resolved Nadle options (with `footer` forced to `false`). |

## Message Protocol

Workers communicate back to the pool via MessagePort. There are exactly three message
types:

| Type           | Fields     | Meaning                                                                                          |
| -------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `"start"`      | `threadId` | The task function is about to execute. Sent after cache validation determines the task must run. |
| `"up-to-date"` | `threadId` | Cache validation determined outputs are current. No execution needed.                            |
| `"from-cache"` | `threadId` | Outputs were restored from cache. No execution needed.                                           |

### Completion Detection

There is **no explicit "done" message**. Completion is inferred:

- **Success**: the worker's promise resolves. The pool then checks the message type
  received to determine the outcome (execute, up-to-date, or from-cache).
- **Failure**: the worker's promise rejects with an error.

## Worker Execution Flow

1. Initialize Nadle in the worker thread on the first task dispatch using a lightweight
   path: the worker receives the fully resolved options (including the project structure)
   from the main thread, loads config files to populate task function closures and the
   task registry, but skips project resolution, option merging, and task input resolution.
   The instance is cached at module scope and reused for subsequent dispatches within
   the same thread, so config files are loaded at most once per worker thread lifetime.
2. Look up the task by ID in the registry.
3. Resolve the task's configuration and options.
4. Resolve the working directory (relative to project root).
5. Run cache validation (see [05-caching.md](05-caching.md)).
6. Based on validation result:
   - **not-cacheable** or **cache-disabled**: send `"start"`, apply env, execute, restore env.
   - **up-to-date**: send `"up-to-date"`, return.
   - **restore-from-cache**: restore outputs, update cache pointer, send `"from-cache"`.
   - **cache-miss**: log reasons, send `"start"`, apply env, execute, restore env,
     save outputs and metadata.

## Timeouts and Retries

A task may declare a `timeout` (milliseconds) and/or a `retries` count (see
[02-task-configuration.md](02-task-configuration.md)). They apply only to the
execution of the task function — never to cache restore, which is not retried or
timed.

- **Attempt** — one invocation of the task function. A task runs up to
  `1 + retries` attempts (default `retries` is `0`, i.e. a single attempt).
- **Timeout** — if `timeout` is set, each attempt is bounded. An attempt that
  does not settle within `timeout` milliseconds fails with a timeout error. The
  task function is not forcibly interrupted (its asynchronous work may continue);
  the attempt is treated as failed for scheduling and retry purposes.
- **Retry** — when an attempt fails (including by timeout), the task is retried
  until it succeeds or the attempts are exhausted. The final failure (the last
  attempt's error) is the task's error. A succeeding attempt makes the task
  succeed regardless of earlier failures.
- Environment injection is applied and restored around the attempts, not around
  each individual attempt.

`timeout` must be a positive integer and `retries` a non-negative integer;
otherwise a configuration error is raised.

## Environment Injection

Before executing the task function:

1. The original process environment is merged with the task's `env` field.
2. After execution, injected keys are removed and original values restored.

Non-string env values are converted to strings before application.

## Cancellation

If a task fails and other tasks are still running:

1. The pool is destroyed, which terminates all worker threads.
2. A terminated worker throws a "Terminating worker thread" error.
3. The pool detects this error and checks if the task's status is Running.
4. If Running, the task is marked as Canceled (not Failed).

## Cleanup

The pool is **always** destroyed in a `finally` block after execution, whether it
succeeds or fails. This ensures all worker threads are terminated.

## Task Chaining

After a task completes successfully, the pool queries the scheduler for newly ready
tasks (those whose indegree has reached zero). Each ready task is dispatched to the
pool, enabling concurrent execution of independent tasks.
