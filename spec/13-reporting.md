# 13 — Reporting

Nadle provides real-time execution feedback through a footer renderer and an optional
end-of-run summary.

## Footer

The footer is a live-updating display at the bottom of the terminal showing execution
progress.

### Content

The footer displays:

- **Tasks line**: `{pending} pending | {running} running | {done} done ({total} scheduled)`
- **Duration line**: elapsed time since execution started.
- **Worker lines**: one line per active worker thread, showing the task name or `IDLE`.

### Update Frequency

The execution tracker updates the duration every **100ms** via an interval timer.
The footer re-renders on each task event (start, finish, fail, cancel, up-to-date,
from-cache, scheduled).

### Rendering

The footer renderer uses ANSI cursor control to update the footer in place:

- Standard output and stderr are intercepted.
- The footer is rendered below the buffered output.
- On each update, the previous footer is erased and redrawn.

### When Disabled

The footer is disabled in these conditions:

| Condition      | Reason                                                      |
| -------------- | ----------------------------------------------------------- |
| CI environment | Detected via `std-env` library's `isCI` flag.               |
| Non-TTY stdout | When `process.stdout.isTTY` is falsy (piped output, etc.).  |
| Worker threads | Footer is always disabled inside workers (`footer: false`). |
| `--no-footer`  | Explicit CLI flag.                                          |

When disabled, a default renderer is used that does not perform any cursor manipulation.

## Task Status Messages

During execution, each task event produces a status message:

| Event           | Output                             |
| --------------- | ---------------------------------- |
| Task started    | `> Task {label} STARTED`           |
| Task finished   | `✓ Task {label} DONE {duration}`   |
| Task up-to-date | `- Task {label} UP-TO-DATE`        |
| Task from cache | `↩ Task {label} FROM-CACHE`        |
| Task failed     | `✗ Task {label} FAILED {duration}` |
| Task canceled   | `✗ Task {label} CANCELED`          |

## Execution Result

### Successful Run

On successful completion:

```
RUN SUCCESSFUL in {duration}
{N} tasks executed[, {N} tasks up-to-date][, {N} tasks restored from cache]
```

Up-to-date and from-cache counts are only shown if greater than zero.

### Failed Run

On failure:

```
RUN FAILED in {duration} ({N} tasks executed, {N} tasks failed)
```

If `--stacktrace` is not set, a hint is shown:

```
For more details, re-run the command with the --stacktrace option...
```

## Summary (`--summary`)

When `--summary` is passed, an end-of-run profiling table is printed showing each
finished task with its execution duration. This is rendered after the success message
and before the final status line.

Only tasks with status Finished are included in the summary (not up-to-date or
from-cache tasks).

## Welcome Banner

At execution start (unless `--show-config` is active), Nadle prints:

```
▶ Welcome to Nadle v{version}!
Using Nadle from {path}
Loaded configuration from {configFile}[ and {N} other(s) files]
```

## Task Resolution Display

If any task names were auto-corrected during resolution (e.g., fuzzy matching), the
corrected mappings are displayed:

```
Resolved tasks:
    {original}  → {corrected}
```
