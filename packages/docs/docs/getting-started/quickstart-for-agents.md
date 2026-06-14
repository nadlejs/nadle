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

## Machine-readable output (`--json`)

Add `--json` to a read command to get a single, stable JSON document on stdout — no
banner, footer, colors, or run summary, so the output parses cleanly:

```bash
# Every task with its full metadata (name, label, group, description, dependsOn, inputs, outputs, workspace)
nadle --list --json

# All workspaces with their parent
nadle --list-workspaces --json

# The ordered execution plan
nadle build --dry-run --json

# The dependency graph as nodes + roots (the tree/mermaid choice is ignored)
nadle build --graph --json

# A single task's explanation as structured data
nadle --explain test --json
```

`--json` applies to `--list`, `--list-workspaces`, `--dry-run`, `--graph`, and
`--explain`. `--show-config` and `--config-key` already emit JSON. Example
`nadle --list --json` shape:

```json
[
	{
		"name": "test",
		"label": "test",
		"group": "CI",
		"workspace": "root",
		"description": "Run tests",
		"dependsOn": ["build"],
		"inputs": [],
		"outputs": []
	}
]
```

## Next steps

- [CLI Reference](../cli-reference) — every flag, alias, type, and default.
- [Configuration Reference](../config-reference) — config file and `nadle.config.ts` fields.
