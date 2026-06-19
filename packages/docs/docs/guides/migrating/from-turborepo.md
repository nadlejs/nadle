---
description: Migrate a turbo.json pipeline to Nadle — concept mapping, before/after example, and a ready-to-use agent prompt.
keywords: [nadle, migration, turborepo, turbo.json, pipeline, monorepo, migrate]
---

# Migrating from Turborepo

Turborepo orchestrates `package.json` scripts across a monorepo using a `turbo.json`
pipeline. Nadle covers the same ground — task graph, caching, workspace scoping — but the
task bodies and their wiring live in TypeScript instead of being split between `turbo.json`
and each package's scripts.

## How concepts map

| Turborepo                                     | Nadle                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `turbo.json` `tasks` (formerly `pipeline`)    | task definitions in `nadle.config.ts`                                    |
| `"dependsOn": ["^build"]` (upstream packages) | [workspace dependencies](../../concepts/workspace.md) + task `dependsOn` |
| `"dependsOn": ["build"]` (same package)       | `dependsOn: ["build"]` on the task                                       |
| `"outputs": ["dist/**"]`                      | [`outputs`](../configuring-task.md) on the task                          |
| `"inputs": ["src/**"]`                        | [`inputs`](../configuring-task.md) on the task                           |
| `turbo run build`                             | `nadle build`                                                            |
| per-package `scripts`                         | per-[workspace](../../concepts/workspace.md) `tasks.register`            |
| remote cache                                  | local cache (see the [caching concept](../../concepts/task.md))          |

The `^` upstream-dependency operator has no single keyword in Nadle: a task depending on its
workspace dependencies' `build` is expressed by declaring those workspace deps and depending
on their tasks explicitly. Most pipelines only need same-package `dependsOn`, which is a
direct rename.

## Before / after

`turbo.json`:

```json
{
	"tasks": {
		"build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
		"test": { "dependsOn": ["build"] },
		"lint": {}
	}
}
```

`nadle.config.ts` (in the package that owns these tasks):

```ts
import { tasks, ExecTask, Inputs, Outputs } from "nadle";

tasks.register("build", {
	run: ExecTask,
	options: { command: "tsc" },
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("dist")]
});

tasks.register("test", {
	run: ExecTask,
	options: { command: "vitest", args: ["run"] },
	dependsOn: ["build"]
});

tasks.register("lint", { run: ExecTask, options: { command: "eslint", args: ["."] } });
```

Run `nadle build` across the monorepo the same way `turbo run build` did; declared
`inputs`/`outputs` make the result cacheable. See
[Monorepo](../../getting-started/features/monorepo.md) for workspace setup.

## Migrate with an agent

Paste this prompt into your coding agent with `turbo.json` and the package scripts open:

```text
Convert my Turborepo setup to Nadle.

For each entry in turbo.json's `tasks` (or `pipeline`):
- Create a tasks.register(name, { run: ExecTask, options: { command, args }, ... }) where the
  command/args come from that package's matching package.json script.
- Map "dependsOn": ["x"] (same-package) to dependsOn: ["x"].
- Map "outputs" to outputs: [Outputs.dirs(...)] / Outputs.files(...) and "inputs" to inputs: [Inputs.dirs(...)].
- For "^build" (upstream) deps, leave a TODO comment noting it must be wired via workspace
  dependencies, and ask me which workspaces the package depends on.
- Put each package's tasks in that package's nadle.config.ts.

Import only the tasks/helpers you use from "nadle". Show me the files you produced.
```
