---
description: Migrate a package.json scripts block to a nadle.config.ts — mapping table, before/after example, and a ready-to-use agent prompt.
keywords: [nadle, migration, npm scripts, package.json, migrate, npm run]
---

# Migrating from npm Scripts

A `package.json` `scripts` block is a flat list of shell commands keyed by name. Nadle gives
each of those scripts a real task with a dependency graph, caching, and workspace awareness.
This guide maps the common patterns and ends with a [prompt](#migrate-with-an-agent) you can
hand to a coding agent to do the conversion for you.

## How concepts map

| npm scripts                                | Nadle                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `"build": "tsc"`                           | `tasks.register("build", { run: ExecTask, options: { command: "tsc" } })`     |
| `"test": "vitest run"`                     | a task whose `run` is `ExecTask` with `command: "vitest"`, `args: ["run"]`    |
| `npm run lint && npm run build` (chained)  | one task with `dependsOn: ["lint"]` — Nadle orders them                       |
| `pre`/`post` hooks (`prebuild`)            | an explicit dependency via [`dependsOn`](../configuring-task.md#dependson)    |
| `npm run a & npm run b` (parallel)         | two independent tasks, run with `nadle a b --parallel`                        |
| workspace scripts (`npm run build -w pkg`) | a per-[workspace](../../concepts/workspace.md) task, run as `nadle pkg:build` |

The big shift: chains and `pre`/`post` hooks become **declared dependencies** instead of
shell `&&`. Nadle then schedules them, runs each at most once, and caches results.

## Before / after

`package.json`:

```json
{
	"scripts": {
		"clean": "rimraf dist",
		"prebuild": "npm run clean",
		"build": "tsc",
		"test": "vitest run",
		"check": "npm run build && npm run test"
	}
}
```

`nadle.config.ts`:

```ts
import { tasks, ExecTask } from "nadle";

tasks.register("clean", { run: ExecTask, options: { command: "rimraf", args: ["dist"] } });

tasks.register("build", {
	run: ExecTask,
	options: { command: "tsc" },
	dependsOn: ["clean"] // was the `prebuild` hook
});

tasks.register("test", { run: ExecTask, options: { command: "vitest", args: ["run"] } });

tasks.register("check", {
	dependsOn: ["build", "test"] // was `npm run build && npm run test`
});
```

`nadle check` now runs `clean → build` and `test`, then `check`, skipping anything already
cached. See [Registering Task](../registering-task.md) and
[Configuring Task](../configuring-task.md) for the full spec.

:::tip
Scripts that just call the package manager (`npm install`, `npm publish`) can use the
[`NpmTask`](../../api/index/variables/NpmTask.md) helper instead of `ExecTask` —
`{ run: NpmTask, options: { args: ["publish"] } }`.
:::

## Migrate with an agent

Paste this prompt into your coding agent with both files open:

```text
Convert my package.json `scripts` block into a nadle.config.ts at the project root.

Rules:
- One `tasks.register(name, { run: ExecTask, options: { command, args } })` per script.
- Split each script string into `command` (first token) and `args` (the rest, as an array).
- Replace `&&` chains and `pre`/`post` hooks with `dependsOn` arrays — do NOT keep the `&&`.
- For scripts that only invoke npm (e.g. "npm publish"), use NpmTask with options.args instead.
- Import only the tasks you use from "nadle".
- Leave package.json scripts in place; just add the equivalent nadle.config.ts.

Show me the resulting nadle.config.ts.
```
