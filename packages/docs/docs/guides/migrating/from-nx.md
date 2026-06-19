---
description: Migrate Nx targets and project.json/nx.json to Nadle — concept mapping, before/after example, and a ready-to-use agent prompt.
keywords: [nadle, migration, nx, project.json, nx.json, targets, monorepo, migrate]
---

# Migrating from Nx

Nx describes work as **targets** on projects, configured in `project.json` (per project) and
`nx.json` (defaults and the task graph). Nadle expresses the same targets as tasks in a
`nadle.config.ts` per workspace, with dependencies and caching declared inline.

## How concepts map

| Nx                                            | Nadle                                                                                           |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| target (`build`, `test`, …) in `project.json` | `tasks.register(name, { run: ExecTask, … })`                                                    |
| `executor` + `options`                        | `ExecTask` with `command`/`args` (or a [reusable task](../registering-task.md#3-reusable-task)) |
| `dependsOn: ["^build"]` (project deps)        | [workspace dependencies](../../concepts/workspace.md) + task `dependsOn`                        |
| `dependsOn: ["build"]` (same project)         | `dependsOn: ["build"]`                                                                          |
| `inputs` / `outputs` (caching)                | [`inputs`](../configuring-task.md) / [`outputs`](../configuring-task.md)                        |
| project = a directory with `project.json`     | a [workspace](../../concepts/workspace.md)                                                      |
| `nx run app:build` / `nx build app`           | `nadle app:build`                                                                               |
| `nx run-many -t build`                        | `nadle build` (runs the task across workspaces)                                                 |

Nx targets usually wrap an executor (`@nx/vite:build`). In Nadle you call the underlying tool
directly through `ExecTask`, or wrap a repeated pattern in your own
[reusable task](../registering-task.md#3-reusable-task).

## Before / after

`project.json`:

```json
{
	"name": "app",
	"targets": {
		"build": {
			"executor": "@nx/js:tsc",
			"options": { "outputPath": "dist/app" },
			"dependsOn": ["^build"],
			"outputs": ["{projectRoot}/dist"]
		},
		"test": { "executor": "@nx/vite:test", "dependsOn": ["build"] }
	}
}
```

`nadle.config.ts` (in the `app` workspace):

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
```

`nadle app:build` replaces `nx build app`. See
[Monorepo](../../getting-started/features/monorepo.md) for wiring workspaces together.

## Migrate with an agent

Paste this prompt into your coding agent with `nx.json` and the relevant `project.json` open:

```text
Convert my Nx targets to Nadle.

For each target in each project.json:
- Create tasks.register(name, { run: ExecTask, options: { command, args }, ... }).
- Resolve the executor to the real CLI it runs (e.g. @nx/vite:test -> vitest run, @nx/js:tsc -> tsc)
  and put that in command/args. If you can't resolve an executor, leave a TODO and ask me.
- Map same-project "dependsOn": ["x"] to dependsOn: ["x"].
- Map "inputs"/"outputs" to Inputs.dirs/files(...) and Outputs.dirs/files(...).
- For "^build" (upstream project) deps, leave a TODO noting it needs workspace dependencies,
  and ask me which projects this one depends on.
- Put each project's tasks in that project's directory as nadle.config.ts (it becomes a workspace).

Import only what you use from "nadle". Show me the files you produced.
```
