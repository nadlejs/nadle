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

## Machine-readable errors

With `--reporter agent`, a failure prints a single structured error record to
**stderr** as one JSON line, in addition to the human-readable output. Parse it
to learn what failed without scraping prose:

```jsonc
{ "errorCode": 3, "errorType": "TaskNotFoundError", "message": "Task nope not found in root workspace." }
```

| Field       | Description                                                                |
| ----------- | -------------------------------------------------------------------------- |
| `errorCode` | The process exit code (`1` generic, `2` config, `3` not found, `4` cycle). |
| `errorType` | The error class name.                                                      |
| `message`   | The human-readable message.                                                |
| `task`      | The failing task's label — present only for task-execution failures.       |

Without `--reporter agent`, no JSON line is emitted and the human error output is
unchanged.

## Next steps

- [CLI Reference](../cli-reference) — every flag, alias, type, and default.
- [Configuration Reference](../config-reference) — config file and `nadle.config.ts` fields.
