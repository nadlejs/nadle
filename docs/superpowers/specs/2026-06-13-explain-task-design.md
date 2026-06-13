# `nadle --explain <task>` Design

**Status:** Approved (self-driven; user directed "do features, don't ask").
**Issue:** [#638](https://github.com/nadlejs/nadle/issues/638) — explain why a task will run and what depends on it.

## Goal

Print a static, human-readable explanation of a single task's place in the graph:
why it would run (what pulls it in), what depends on it, and what its declared
inputs are. Complements the runtime cache `--why` (#636) — that explains a _past
run's_ cache outcome; this explains the _static graph_ without running anything.

## Surface

A flag, not a positional subcommand:

```
nadle --explain <task>
```

**Why a flag, not `nadle why <task>`** (the issue's original spelling): the CLI is a
single yargs `$0 [tasks...]` command — every other mode is a flag (`--graph`,
`--why`, `--list`, `--show-config`). A real `why` subcommand would fight the `$0`
default-command and collide with a user task literally named `why`. A flag is
collision-free and consistent with the shipped `--graph`/`--why` flag style.
`--explain` avoids overloading the existing boolean `--why`.

The flag takes a task name in the same syntax accepted positionally
(`build`, `pkg:build`, `//root:build`). It resolves via `TaskRegistry.parse`,
which already throws `TaskNotFoundError` with did-you-mean suggestions on a miss.

## Output

Three sections, plain text (tinyrainbow styling like `task-graph.ts`):

```
Task: //root:build

Why it runs:
  Requested directly on the command line.
  Also pulled in by:
    check → build
    publish → bundle → build

What depends on it:
  check
  publish (via bundle)

Inputs:
  src/**/*.ts
  package.json
  (caching enabled — a change to any input invalidates the cache)
```

Section rules:

- **Why it runs** — every dependency path from a requested root down to the task.
  If the task itself was requested, lead with "Requested directly on the command
  line." If nothing pulls it in and it wasn't requested, say "Nothing requests this
  task; run it explicitly with `nadle <task>`."
- **What depends on it** — direct dependents from `dependentsGraph`. Empty → "Nothing
  depends on this task."
- **Inputs** — declared input globs from `task.configResolver().inputs`. None →
  "No declared inputs (always runs; not cacheable)." Note whether caching is enabled
  for the task. No runtime fingerprint — that is `--why`'s job.

## Architecture

Mirror the `--graph` slice (#653), which is the closest existing pattern.

- **`core/options/cli-options.ts`** — add `explain` option: `{ key: "explain",
options: { type: "string", description: "Explain why a task runs, what depends on
it, and its inputs" } }`. Group under "Execution options:" in `cli.ts`.
- **`core/options/types.ts`** — `NadleCLIOptions.explain?: string`; omit `explain`
  from the `Required<>` in `NadleResolvedOptions` and redeclare `explain?: string`
  (same shape as `graph`).
- **`core/options/options-resolver.ts`** — no default needed (optional, undefined
  when absent), same as `configKey`/`graph`.
- **`core/reporting/task-explanation.ts`** — new pure function
  `renderTaskExplanation(props): string`. Props is plain data (no scheduler/registry
  references) so it is unit-testable in isolation, exactly like `renderTaskGraph`.
  ```ts
  export namespace TaskExplanation {
  	export interface Props {
  		readonly taskId: string;
  		readonly requestedDirectly: boolean;
  		/** Each path is root → … → taskId (labels), excluding the direct-request case. */
  		readonly pullPaths: readonly string[][];
  		/** Direct dependents (labels). */
  		readonly dependents: readonly string[];
  		readonly inputs: readonly string[];
  		readonly cachingEnabled: boolean;
  	}
  }
  export function renderTaskExplanation(props: TaskExplanation.Props): string;
  ```
- **`core/handlers/explain-handler.ts`** — new `ExplainHandler extends BaseHandler`.
  `canHandle()` → `this.context.options.explain !== undefined`. `handle()`:
  1. resolve the explain arg via `taskRegistry.parse(explain, rootWorkspaceId)`;
  2. `scheduler.init()` over all tasks (no roots → full graph);
  3. walk `dependencyGraph`/`dependentsGraph` to build `pullPaths` (BFS/DFS from each
     requested root to the target) and direct `dependents`;
  4. read declared inputs + caching flag from the task config;
  5. `logger.log(renderTaskExplanation(...))`.
- **`core/handlers/index.ts`** — register `ExplainHandler` before `ExecuteHandler`,
  next to `GraphHandler`.

`pullPaths` computation lives in the handler (it needs scheduler/registry); the
renderer stays pure.

### "Requested roots" for pull paths

When `--explain` is used, the user may also pass positional tasks
(`nadle build --explain compile`). Those positional tasks are the requested roots
for the "why it runs" paths. If no positional tasks are given, fall back to all
top-level tasks as roots so the explanation is still useful (every chain that
reaches the target). Document this in the help/description is unnecessary; behavior
is intuitive.

## Errors

- Unknown task → `TaskRegistry.parse` already throws `TaskNotFoundError` with
  suggestions; let it propagate (consistent with positional task resolution).
- No task arg (`--explain` with empty string) → yargs gives `""`; treat as a usage
  error: `logger.error` an explanation that `--explain` needs a task name. (Or rely
  on yargs requiring a value for a string option — verify in the harness.)

## Testing

Integration-first, matching `test/options/graph.test.ts`:

- **`test/options/explain.test.ts`** — spawn CLI against a fixture with a known
  graph; assert the three sections appear with expected task names. Cover: direct
  request, transitive pull-in, a leaf with dependents, a task with inputs vs without,
  unknown-task error (suggestions).
- **`test/unit/task-explanation.test.ts`** — unit-test `renderTaskExplanation` with
  hand-built props for each section's empty/non-empty branches. Pure function, no
  spawn.

## Out of scope (YAGNI)

- No `mermaid`/JSON output format — plain text only. (`--graph` covers machine
  formats.)
- No runtime cache fingerprint in the Inputs section — that is `--why`.
- No multi-task `--explain a --explain b` — one task per invocation.

## Snapshot tax

The new resolved option `explain` enters the resolved-options object, but #658's
serializer redaction (`Resolved options: {options}`) already shields builtin-task
and most snapshots. Still regenerate the option-dump snapshots that assert the dump
intentionally — `show-config` and `config-key` — and run each alone with `-u` to
prune obsolete keys, then verify with `CI=true`. (Per MEMORY.md snapshot gotcha.)
