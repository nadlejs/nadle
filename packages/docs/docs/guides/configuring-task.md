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

## cacheVerdict

- **Type:** `boolean` (default `false`)

Caches the success verdict of a task that declares `inputs` but produces no output files —
a linter, a formatter in check mode, a type-checker. While the inputs are unchanged the task
reports as up-to-date instead of running again.

```ts
tasks.register("lint", {
	cacheVerdict: true,
	inputs: [Inputs.dirs("src")],
	run: () => {
		/* … */
	}
});
```

Only success is cached. A failing task is never written to the cache, so it re-runs and
re-prints its diagnostics on every invocation until the problem is fixed.

Setting `cacheVerdict` asserts that the task produces no file another task consumes; on a
cache hit the task body does not run, so any such file would never be produced. A task that
does generate artifacts must declare `outputs` instead — `cacheVerdict` is ignored when
`outputs` are present. Note that a cache hit also means the task's own console output is not
reprinted.

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

## onlyIf

- **Type:** `({ options, context }) => unknown | Promise<unknown>`

A predicate deciding whether the task's body runs. It receives the same single argument as
`run` — the resolved `options` and the runner `context` — and may resolve synchronously or
asynchronously. When it resolves to a **falsey** value the task is skipped; any **truthy**
value (or omitting `onlyIf` altogether) runs the task normally. The return type is
deliberately wide, so returning a missing file path or an empty array skips just as `false`
does. This is Nadle's equivalent of Gradle's `Task.onlyIf`.

```ts
tasks.register("publish", {
	dependsOn: ["build"],
	onlyIf: () => process.env.CI === "true",
	run: () => {
		/* … */
	}
});
```

Since the predicate is handed the resolved options, a
[reusable task](./registering-task.md#3-reusable-task) can decide from its own
configuration — and `context` exposes the same `logger`, `workingDir` and
`passthroughArgs` the body sees:

```ts
tasks.register("copy-assets", {
	run: CopyTask,
	options: { from: "assets", into: "dist" },
	onlyIf: ({ options, context }) => {
		context.logger.info(`Checking ${options.from}`);

		return Fs.existsSync(Path.join(context.workingDir, options.from));
	}
});
```

### Skipping never prunes the graph

Skipping affects **only the task itself**:

- Its **dependencies have already run** — they are scheduled and executed before the
  predicate is ever evaluated.
- Its **dependents still run**, treating the skipped task as satisfied.

Because a skipped task produces nothing, a dependent that expects its outputs must
tolerate their absence — "satisfied" means the dependency is not waited on, not that its
outputs exist.

This is the key difference from [`--exclude`](../config-reference.md#--exclude), which
removes tasks from the graph before anything executes. Use `--exclude` to prune work; use
`onlyIf` to turn a single task into a no-op while everything around it proceeds.

### Evaluation timing

The predicate runs **at execution time** — after the task's configuration, options and
working directory are resolved and after its dependencies have completed, but **before
cache validation**. Two consequences follow:

- The predicate may inspect whatever the dependencies produced, on disk or in the
  environment, and decide from it.
- A skipped task does **no cache work at all**: no fingerprint is computed, no outputs are
  restored, and no cache entry is written — even when the task declares `inputs` and
  `outputs`.

### Failures and reporting

A predicate that throws, or whose promise rejects, **fails the task** exactly as a failing
body would. `timeout` and `retries` bound the task function only; they never apply to the
predicate, which is evaluated once.

A skipped task is reported as `SKIPPED` and counted in the run summary's skipped total.

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
