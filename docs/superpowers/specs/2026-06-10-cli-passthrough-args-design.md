# Design: CLI Argument Passthrough via `--` Separator

**Issue:** [#525](https://github.com/nadlejs/nadle/issues/525)
**Date:** 2026-06-10
**Status:** Approved

## Problem

There is no way to pass extra arguments from the CLI through to a task's underlying
command. `nadle test -- -u` and `nadle test -u` are both rejected by yargs strict mode.
Task arguments are fully baked into `nadle.config.ts` at definition time. Other tools
(pnpm, npm, turborepo) support this as a standard workflow.

## Prior art

| Tool       | Mechanism                                             | Multi-task behavior          | Dependencies receive args? |
| ---------- | ----------------------------------------------------- | ---------------------------- | -------------------------- |
| pnpm / npm | `run script -- args`                                  | N/A (single script)          | N/A                        |
| Turborepo  | `turbo run a b -- args`                               | All _named_ tasks get args   | No                         |
| Nx         | unknown args + `--args`, `forwardAllArgs` opt-out     | Forwarded to invoked targets | No                         |
| Gradle     | Per-task declared `@Option` (e.g. `run --args="..."`) | Each task parses own flags   | No                         |

Convergent rules: dependency tasks never receive passthrough args; args participate in
cache keys; per-task partitioning does not exist anywhere (turborepo
[#5743](https://github.com/vercel/turborepo/issues/5743) is an open request).

## Decision summary

Turborepo-style blanket append, scoped to explicitly requested tasks, exposed uniformly
on `RunnerContext`, auto-consumed by exec-based builtin tasks, included in the cache
fingerprint of requested tasks. Multiple requested tasks are allowed and all receive the
same args; a notice is logged when more than one task receives them (Option 1 — see
Alternatives).

## 1. CLI grammar

```
nadle [tasks...] [nadle-options] -- [passthrough-args...]
```

Everything after the first bare `--` is captured verbatim and never parsed by yargs.

- Implementation: `.parserConfiguration({ "populate--": true })` in `src/cli.ts`;
  captured args appear in `argv["--"]`.
- `.strict()` remains. Unknown flags _before_ `--` still error. No existing CLI
  behavior changes.
- Args are kept as an array of strings and passed to `execa` as array elements — no
  shell re-interpretation; spaces and quoting preserved.

## 2. Scope semantics

**Passthrough args go to tasks explicitly requested on the CLI — never to dependency
tasks.**

- Multiple requested tasks all receive the same args.
- Glob-selected tasks (#591) count as requested: `nadle "test:*" -- -u` passes `-u` to
  every matched task.
- Workspace-qualified ids likewise: `nadle app:test lib:test -- -u` → both.
- Tasks removed via `--exclude` are not executed, hence receive nothing.
- `--` combined with `--list`, `--dry-run`, or zero tasks: args are carried but unused
  by execution; dry run displays them (§6).
- When more than one requested task will receive args, log an info-level notice:
  `Passing extra arguments [--reporter dot] to 2 tasks: check, test`.

## 3. Data flow

```
argv["--"]
  → NadleCLIOptions.passthroughArgs?: string[]          (src/core/options/types.ts)
  → CLIOptionsResolver                                   (copy through)
  → NadleResolvedOptions.passthroughArgs: string[]       (default [])
  → WorkerParams.options                                 (already serialized to workers)
  → worker.ts: requested-task check → RunnerContext
```

The worker decides whether the current task was requested by comparing its `taskId`
against `options.tasks` (`ResolvedTask[]`), which is already present in the resolved
options. No new worker protocol fields.

## 4. API surface

`RunnerContext` (`src/core/interfaces/task.ts`) gains one field:

```ts
export interface RunnerContext {
	readonly logger: Logger;
	readonly workingDir: string;
	/** Args after `--` on the CLI. Empty unless this task was explicitly requested. */
	readonly passthroughArgs: readonly string[];
}
```

- **Custom tasks** read `context.passthroughArgs` directly. Raw strings; parsing is the
  task's responsibility.
- **Exec-based builtins** (`ExecTask`, `PnpmTask`, `NpxTask`, `NodeTask`, `NpmTask`,
  `PnpxTask`) append `context.passthroughArgs` after their configured args:
  `[...commandArguments, ...context.passthroughArgs]`.
- **Non-exec builtins** (`CopyTask`, `DeleteTask`) ignore them. Documented.
- No per-task opt-in/opt-out in v1 (YAGNI; dependency exclusion already prevents the
  dangerous case). If demanded later: a `TaskConfiguration` flag, with Gradle/Nx
  precedent.

Public API change → regenerate `packages/nadle/index.api.md` via `npx nadle build`.

## 5. Caching

Passthrough args change task behavior, so they must affect the cache key — otherwise
`nadle test -- -u` followed by `nadle test` would return a stale FROM-CACHE result.

- `CacheKey.compute` (used by `CacheValidator.computeCacheQuery`) gains
  `passthroughArgs` as a key input, **only for requested tasks**.
- Dependency tasks' keys are unchanged — they never see the args, and their keys must
  stay stable for cache reuse.
- An empty array must produce the same key as today so existing cache entries remain
  valid for plain runs.

## 6. UX details

- **Dry run** annotates requested tasks with the args: `test (args: -u)`.
- **Exec log line**: the existing `Running command: ...` output naturally includes the
  appended args.
- **Help text**: add an epilogue example showing `nadle test -- -u`.
- **Multi-task notice**: see §2.

## 7. Spec and docs updates

- `spec/09-cli.md`: new "Argument Passthrough" section — grammar, requested-task scope
  rule, dependency exclusion, cache interaction, multi-task notice.
- `spec/10-builtin-tasks.md`: which builtins consume passthrough args.
- `spec/CHANGELOG.md` entry + minor version bump in `spec/README.md` (new concept).
- `packages/docs/`: update `guides/executing-task.md`; document `RunnerContext` field in
  API reference.

## 8. Testing

Integration (execa-spawned CLI, custom matchers, per house style):

1. `nadle test -- -u` → exec task command receives `-u`.
2. Two requested tasks → both receive args; notice logged.
3. Dependency task does **not** receive args.
4. Glob pattern → all matched tasks receive args.
5. Cache: run with args is not a cache hit of run without args; dependencies stay
   cached across both runs.
6. Unknown flag before `--` still errors (strict mode preserved).
7. Custom task reads `context.passthroughArgs`.
8. Dry run displays args on requested tasks.

Unit:

- `cli-options-resolver` captures `argv["--"]` into `passthroughArgs`.
- Cache key includes/excludes `passthroughArgs` per requested/dependency status.

## Alternatives considered

- **Option 2 — restrict `--` to a single requested task** (pnpm semantics; error
  otherwise). Safest, and relaxing later is non-breaking. Rejected: blocks the
  legitimate homogeneous cases (`nadle "test:*" -- -u`, `nadle app:test lib:test -- -u`)
  to prevent a recoverable mistake whose failure is visible in the logged command.
- **All executed tasks receive args** (including dependencies). Rejected: args meant
  for `test` would break `build`; no other tool does this.
- **Gradle-style declared per-task options**. Precise but heavyweight; deferred.

## Out of scope

- Per-task arg partitioning (`task1 -- a --- task2 -- b`).
- Gradle-style declared `@Option` flags per task.
- Per-task opt-in/opt-out configuration.
