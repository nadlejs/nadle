---
description: Register tasks in Nadle using tasks.register — as empty aggregation tasks, inline actions, or reusable defineTask types via a keyed spec.
keywords: [nadle, register task, tasks.register, task registration, spec]
---

# Registering Task

Every task is registered with `tasks.register(name, spec?)`. The first argument is the
task name; the optional second argument is a **spec** — a single keyed object describing
the task. All forms below are variations of that one signature.

A spec is a plain object with a `run` field (the task body) plus any
[configuration fields](./configuring-task.md) (`group`, `dependsOn`, `inputs`, …) sitting
directly alongside it:

```ts
import { tasks } from "nadle";

tasks.register("build", {
	run: async ({ context }) => {
		context.logger.log("Building…");
	},
	group: "CI",
	dependsOn: ["compile"]
});
```

Two shorthands cover the common cases: omit the spec entirely for an empty task, or pass a
bare function when you only need a body.

---

## 1. Empty Task

An empty task has no execution logic. It is typically used to define a logical grouping of other tasks or to act as a single entry point in the task graph.

This is useful when creating a high-level task that simply depends on other subtasks.

**Example:**
To create a top-level **build** task that runs multiple subtasks for building different parts of your project, you can define it like this:

```ts
import { tasks } from "nadle";

tasks.register("build", {
	dependsOn: ["buildFrontend", "buildBackend"]
});
```

When a task only needs a name and nothing else, omit the spec entirely:

```ts
tasks.register("checkpoint");
```

## 2. Action Task

An action task includes inline logic that will be executed when the task runs. The task function can be **synchronous** or **asynchronous**.

Use this when the task logic is custom, simple, and doesn't need to be reused across multiple tasks.

When the body is all you need, pass the function directly as the second argument:

```ts
// Synchronous
import fs from "node:fs";

import { tasks } from "nadle";

tasks.register("clean", () => {
	if (fs.existsSync("dist")) {
		fs.rmSync("dist", { recursive: true });
		console.log("Cleaned dist/ directory.");
	} else {
		console.log("dist/ directory does not exist.");
	}
});
```

```ts
// Asynchronous
import { writeFile } from "node:fs/promises";

import { tasks } from "nadle";
import fetch from "node-fetch";

tasks.register("fetchData", async () => {
	const res = await fetch("https://jsonplaceholder.typicode.com/posts");
	const data = await res.json();
	await writeFile("data.json", JSON.stringify(data, null, 2));
	console.log("Fetched and saved data to data.json.");
});
```

To attach configuration to an inline task, use the full spec and put the body under `run`:

```ts
tasks.register("clean", {
	run: () => {
		fs.rmSync("dist", { recursive: true });
	},
	group: "Maintenance",
	description: "Remove build artifacts"
});
```

These kinds of tasks are ideal for setup steps, scripts, or one-off automation logic defined directly in the configuration file.

## 3. Reusable Task

Reusable tasks are based on predefined implementations—either built-in or custom—that accept options to customize behavior.
This makes it easy to reuse logic across multiple tasks without duplicating code.

Pass the task implementation as `run` and its options as `options`:

```ts
import { tasks, CopyTask } from "nadle";

tasks.register("copy", {
	run: CopyTask,
	options: {
		from: "assets",
		into: "dist"
	}
});
```

`options` may be a plain value (as above) or a **resolver** — a function returning the
options — when the values depend on the environment or other dynamic conditions:

```ts
tasks.register("copy", {
	run: CopyTask,
	options: () => ({ from: "assets", into: process.env.OUT_DIR ?? "dist" })
});
```

This pattern is especially useful for standardized operations like copying files, executing shell commands,
or compiling code where the task logic stays the same, but the inputs or targets may vary.

## Deferring the whole spec with `lazy`

Wrap a spec in `lazy` when the entire spec — not just `options` —
should be computed on demand. The thunk runs at most once, the first time Nadle reads the
task's configuration:

```ts
import { tasks, lazy } from "nadle";

tasks.register(
	"publish",
	lazy(() => ({
		run: async ({ context }) => {
			/* … */
		},
		workingDir: process.env.PACKAGE_DIR ?? "./packages/core"
	}))
);
```

## Authoring specs programmatically with `defineSpec`

`defineSpec` is an identity helper that gives you full type inference when building a spec
outside the `register` call — handy for sharing or generating specs programmatically. The
result is passed straight to `register`:

```ts
import { tasks, defineSpec, ExecTask } from "nadle";

const lintSpec = defineSpec({
	run: ExecTask,
	options: { command: "eslint", args: ["."] },
	group: "Quality"
});

tasks.register("lint", lintSpec);
```
