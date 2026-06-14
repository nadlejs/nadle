---
description: Configure Nadle tasks with dependsOn, inputs, outputs, environment variables, and caching using the .config() method.
keywords: [nadle, task configuration, dependsOn, inputs, outputs, caching, env]
---

# Configuring Task

After registering a task, configuration can be applied using `.config(...)`.
This allows you to define metadata, dependencies, environment variables, working directory,
and caching behavior for the task.

You can pass either an object or a function returning an object to `.config(...)`.

```ts
tasks
	.register("exampleTask", () => {
		// task logic
	})
	.config({
		group: "build",
		description: "Compile the example project",
		dependsOn: ["prepare"],
		env: { NODE_ENV: "production" },
		workingDir: "./packages/example",
		inputs: [Inputs.dirs("src")],
		outputs: [Outputs.dirs("lib")]
	});
```

---

The following fields define the available configuration options for a task.
All of them are optional, and you can choose to specify only those that are applicable to your task.

## group

- **Type:** `string`

Used to categorize related tasks under a common group name. Useful for organizing task listings and CLI output.

```ts
tasks.register("compile").config({
	group: "build"
});
```

## description

- **Type:** `string`

Provides a short explanation of what the task does. Often displayed in help commands or task listings.

```ts
tasks.register("compile").config({
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
tasks.register("build").config({
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
tasks.register("build").config({
	env: { NODE_ENV: "production", PORT: 3000 }
});
```

## workingDir

- **Type:** `string`

Overrides the working directory for this task. All relative paths are resolved based on this directory.

```ts
tasks.register("publish").config({
	workingDir: "./packages/core"
});
```

## inputs

- **Type:** `Declration[]`

Declares files, directories, or glob patterns that the task reads from. Used to detect changes for cache invalidation.

```ts
tasks.register("build").config({
	inputs: [Inputs.dirs("src"), Inputs.files("tsconfig.json")]
});
```

## outputs

- **Type:** `Declration[]`

Declares files or directories that the task generates. Nadle uses this information to manage task outputs and caching.

```ts
tasks.register("build").config({
	outputs: [Outputs.dirs("dist")]
});
```

## timeout

- **Type:** `number` (milliseconds, positive integer)

Bounds each execution attempt of the task. An attempt that does not settle within the
timeout fails with a timeout error (and is eligible for `retries`). The task function is
not forcibly interrupted; the attempt is treated as failed.

```ts
tasks.register("deploy").config({
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
tasks.register("flaky-check").config({
	retries: 2,
	timeout: 10_000
});
```

:::tip

You can also use a function to return a configuration object.
This is useful when values depend on environment or dynamic conditions.

```ts
tasks.register("publish").config(() => ({
	workingDir: "./packages/core"
}));
```

:::
