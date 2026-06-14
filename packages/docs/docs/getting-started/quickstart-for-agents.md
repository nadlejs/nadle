---
description: Dense, copy-pasteable Nadle quickstart for AI agents and scripts. Install, write a config, and run tasks with the most common commands.
keywords: [nadle, quickstart, agent, AI, automation, CLI, task runner, copy-paste]
---

# Quickstart for Agents

A dense, copy-pasteable guide for AI agents and scripts. Every snippet runs verbatim.
For the full flag list see the [CLI Reference](../cli-reference); for config file fields see the [Configuration Reference](../config-reference).

## Requirements

- Node.js 22 or later.
- A `package.json` at the project root.

## Install

pnpm (recommended):

```bash
pnpm add -D nadle
```

npm:

```bash
npm install -D nadle
```

yarn:

```bash
yarn add -D nadle
```

Verify:

```bash
nadle --version
```

## Minimal config

Create `nadle.config.ts` at the project root:

```typescript
import { tasks } from "nadle";

tasks
	.register("hello", async () => {
		console.log("Hello from Nadle!");
	})
	.config({ group: "Greetings", description: "Say hello" });
```

## Register, depend, and run

`tasks.register(name, fn)` defines a task; `.config({ ... })` attaches metadata. Use
`dependsOn` to order tasks — dependencies run first.

```typescript
import { tasks } from "nadle";

tasks
	.register("build", async () => {
		console.log("Building...");
	})
	.config({ group: "CI", description: "Build the project" });

tasks
	.register("test", async () => {
		console.log("Testing...");
	})
	.config({ group: "CI", description: "Run tests", dependsOn: ["build"] });
```

Run a task (dependencies run automatically):

```bash
nadle test
```

Run several tasks in order:

```bash
nadle build test
```

## Common invocations

```bash
# Run one or more tasks (positional, in order)
nadle build test

# List every available task
nadle --list          # alias: nadle -l

# Show what would run without executing
nadle --dry-run test  # alias: nadle -m test

# Run only the tasks affected by changes since a git ref
nadle --since main test

# Statically explain why a task runs, what depends on it, and its inputs
nadle --explain test

# Print a summary of executed tasks at the end of the run
nadle --summary build test

# Use the compact, plain reporter built for agents and scripts
nadle --reporter agent build

# Print the task dependency graph instead of executing
nadle --graph
```

## Discovering capabilities

`nadle --capabilities` prints a single machine-readable JSON document describing what this
version of Nadle can do, then exits without running anything. Use it to discover Nadle's
surface programmatically instead of parsing `--help` or loading the config yourself. The
document is the only output (no banner or footer), so it is safe to pipe into a JSON parser.

```bash
nadle --capabilities
```

The document has four top-level fields:

- `version` — the Nadle version that produced the document.
- `flags` — every recognized CLI flag, each with its `name`, `type`, optional `default`,
  optional `choices`, `aliases`, and `description`. This list is derived from the same
  definitions that drive option parsing, so it never drifts from the flags Nadle accepts.
- `tasks` — the tasks discovered from your configuration (the same set as `--list`), each with
  its `id`, `name`, `label`, `workspaceId`, and optional `group` and `description`.
- `config` — a JSON Schema for the task configuration object you pass to `.config({ ... })`.

```jsonc
{
	"version": "0.5.3",
	"flags": [{ "name": "dry-run", "type": "boolean", "default": false, "aliases": ["m"], "description": "..." }],
	"tasks": [{ "id": "root:build", "name": "build", "label": "build", "workspaceId": "root", "group": "CI" }],
	"config": { "title": "TaskConfiguration", "type": "object", "properties": { "dependsOn": {} } }
}
```

## Next steps

- [CLI Reference](../cli-reference) — every flag, alias, type, and default.
- [Configuration Reference](../config-reference) — config file and `nadle.config.ts` fields.
