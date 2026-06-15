---
description: Configure Nadle tasks with dependsOn, inputs, outputs, environment variables, and caching by adding config fields to the task spec.
keywords: [nadle, task configuration, dependsOn, inputs, outputs, caching, env, spec]
---

# Configuring Task

A task is configured through **config fields on its spec** — the keyed object passed as the
second argument to [`tasks.register`](./registering-task.md). Alongside `run` (and
`options` for reusable tasks), the spec carries metadata, dependencies, environment
variables, the working directory, and caching behavior.

```ts
tasks.register("exampleTask", {
	run: () => {
		// task logic
	},
	group: "build",
	description: "Compile the example project",
	dependsOn: ["prepare"],
	env: { NODE_ENV: "production" },
	workingDir: "./packages/example",
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("lib")]
});
```

When a task has no body, the config fields are the entire spec:

```ts
tasks.register("ci", {
	dependsOn: ["build", "test"]
});
```

---

The following fields define the available configuration options for a task.
All of them are optional, and you can choose to specify only those that are applicable to your task.

## group

- **Type:** `string`

Used to categorize related tasks under a common group name. Useful for organizing task listings and CLI output.

```ts
tasks.register("compile", {
	run: () => {
		/* … */
	},
	group: "build"
});
```

## description

- **Type:** `string`

Provides a short explanation of what the task does. Often displayed in help commands or task listings.

```ts
tasks.register("compile", {
	run: () => {
		/* … */
	},
	description: "Transpile TypeScript files to JavaScript"
});
```

## dependsOn

- **Type:** `string[]`

Specifies one or more task names that must be executed before this task runs. Used to build the task execution graph.
If a dependency name does not include a [workspace](../concepts/workspace.md) prefix, Nadle will resolve it in the current workspace
and throw an error if not found.
To refer to a task in another workspace, use the fully qualified [task identifier](../concepts/task.md#identifier).

**Example:**

```ts
tasks.register("build", {
	dependsOn: ["commmon:build", "compile", "root:setup"]
});
```

In this example:

- `commmon:build` refers to the `build` task in the `commmon` workspace.
- `compile` is resolved in the current workspace.
- `root:setup` refers to the `setup` task in the [`root`](../concepts/workspace.md#root-workspace) workspace.

## env

- **Type:** `Record<string, string | number | boolean>`

Specifies environment variables to set while the task runs. Non-string values are
converted to strings before being applied to the task's environment.

```ts
tasks.register("build", {
	run: () => {
		/* … */
	},
	env: { NODE_ENV: "production", PORT: 3000 }
});
```

## workingDir

- **Type:** `string`

Overrides the working directory for this task. All relative paths are resolved based on this directory.

```ts
tasks.register("publish", {
	run: () => {
		/* … */
	},
	workingDir: "./packages/core"
});
```

## inputs

- **Type:** `Declration[]`

Declares files, directories, or glob patterns that the task reads from. Used to detect changes for cache invalidation.

```ts
tasks.register("build", {
	run: () => {
		/* … */
	},
	inputs: [Inputs.dirs("src"), Inputs.files("tsconfig.json")]
});
```

## outputs

- **Type:** `Declration[]`

Declares files or directories that the task generates. Nadle uses this information to manage task outputs and caching.

```ts
tasks.register("build", {
	run: () => {
		/* … */
	},
	outputs: [Outputs.dirs("dist")]
});
```

<AgentPrompt>
Add caching to my Nadle `build` task so it is skipped when its inputs are unchanged. First read the Nadle docs for the current API — fetch https://nadle.dev/llms.txt (or browse https://nadle.dev/docs/guides/configuring-task). Then declare `inputs` for the source files and config it reads, and `outputs` for the directory it produces, using `Inputs.files(...)` / `Outputs.dirs(...)` in the task's keyed spec, and explain how to verify a cache hit.
</AgentPrompt>

## timeout

- **Type:** `number` (milliseconds, positive integer)

Bounds each execution attempt of the task. An attempt that does not settle within the
timeout fails with a timeout error (and is eligible for `retries`). The task function is
not forcibly interrupted; the attempt is treated as failed.

```ts
tasks.register("deploy", {
	run: () => {
		/* … */
	},
	timeout: 30_000
});
```

## retries

- **Type:** `number` (non-negative integer, default `0`)

Number of additional attempts after the first failure. The task runs up to `1 + retries`
attempts and fails only if every attempt fails. Useful for inherently flaky steps (network,
external services). Both `timeout` and `retries` apply only to the task function, never to
restoring outputs from cache.

```ts
tasks.register("flaky-check", {
	run: () => {
		/* … */
	},
	retries: 2,
	timeout: 10_000
});
```

:::tip

When the configuration itself depends on the environment or other dynamic conditions, wrap
the whole spec in [`lazy`](./registering-task.md#deferring-the-whole-spec-with-lazy). The
thunk is evaluated at most once, the first time Nadle reads the task's configuration.

```ts
import { tasks, lazy } from "nadle";

tasks.register(
	"publish",
	lazy(() => ({
		workingDir: process.env.PACKAGE_DIR ?? "./packages/core"
	}))
);
```

:::
