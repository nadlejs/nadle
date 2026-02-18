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

1. Initialize Nadle in the worker thread on the first task dispatch. The instance is
   cached at module scope and reused for subsequent dispatches within the same thread,
   so config files are loaded at most once per worker thread lifetime.
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
