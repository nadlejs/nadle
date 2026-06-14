---
description: Complete reference for Nadle CLI options, configuration file settings, and nadle.config.ts schema for task runner customization.
keywords: [nadle, configuration, CLI, nadle.config.ts, options, reference]
---

# Configuration Reference

Nadle provides flexible configuration options through both CLI flags and the build configuration file.
This reference guide covers the available configuration options and how to use them effectively.

## Configuration File

By default, Nadle will look in the **current working directory** for a configuration file in the following order:

- `nadle.config.js`
- `nadle.config.mjs`
- `nadle.config.ts`
- `nadle.config.mts`

You can also specify a custom configuration file location using the `--config` CLI option.

## CLI Options

### `--config`

- **Type:** `string`
- **Alias:** `-c`
- **Default:** Searches for `nadle.config.{js,mjs,ts,mts}` in the current working directory

Specifies a custom path to the configuration file.
This allows using different configurations for different environments or purposes.
The path can be either absolute or relative to the current working directory.
Use this flag to override the default resolution behavior and point to a specific configuration file as needed.

**Example:**

```bash
nadle --config ./configs/nadle.config.ts
```

### `--exclude`

- **Type:** `string[]`
- **Alias:** `-x`
- **Default:** `[]` (no tasks excluded)

Specifies one or more task names to exclude from execution.

This flag allows selectively skipping certain tasks, which is useful when running a broad task group but needing to omit specific ones.
Multiple exclusions can be provided either as separate flags (`--exclude lint --exclude test`) or as a comma-separated list (`--exclude lint,test`).
Whitespace around task names is trimmed automatically.

### `--list`

- **Type:** `boolean`
- **Alias:** `-l`
- **Default:** `false`

List all available tasks in the current project without executing them. This is useful for seeing what tasks are available to run.

### `--list-workspaces`

- **Type:** `boolean`
- **Default:** `false`

List all available workspaces along with their aliases without executing any tasks.
Useful for discovering defined workspaces and their paths.

### `--dry-run`

- **Type:** `boolean`
- **Default:** `false`

Simulate task execution without actually running the tasks. Shows what would be executed in what order.

```bash
nadle --dry-run build
```

### `--watch`

- **Type:** `boolean`
- **Alias:** `-w`
- **Default:** `false`

Run the requested tasks, then keep running and re-run them whenever any of their
declared `inputs` change. Only tasks whose inputs actually changed re-execute;
the rest stay cached. Config files are watched too (when any task declares
inputs). Press Ctrl-C to exit. Tasks with no declared `inputs` are not watchable.

```bash
nadle build --watch
```

### `--graph`

- **Type:** `string`
- **Choices:** `tree` (default), `mermaid`

Print the task dependency graph instead of executing. `tree` renders an indented forest rooted at
the requested tasks; `mermaid` emits a `graph TD` block you can paste into docs. Implicit
(workspace-derived) dependencies are marked.

```bash
nadle build --graph
nadle build --graph=mermaid
```

### `--since`

- **Type:** `string` (a git ref)

Run only the requested tasks affected by changes since a git ref. A task is affected
when a file inside its workspace directory changed (computed via `git diff --name-only
<ref>`); the dependencies that affected task needs are pulled in too. `nadle build
--since main` builds exactly the packages that changed. If nothing is affected, Nadle
prints a notice and exits 0. Cross-workspace dependent propagation (rebuilding B
because its dependency A changed) is not yet included.

```bash
nadle build test --since main
```

### `--explain`

- **Type:** `string` (a task name)

Explain a single task without running it: why it would run (the dependency paths that pull it in,
or whether it was requested directly), what depends on it, and its declared inputs (plus whether
caching is enabled). Complements `--why`, which explains a past run's cache outcome — `--explain`
is purely static.

```bash
nadle build --explain install
```

### `--why`

- **Type:** `boolean`
- **Default:** `false`

Explain each task's cache outcome. For a hit, states whether the task was up-to-date or restored
from cache; for a miss, lists exactly what changed (the input file added/removed/modified, or that
no previous cache existed). Useful for answering "why did this rebuild?".

```bash
nadle build --why
```

### `--stacktrace`

- **Type:** `boolean`
- **Default:** `false`

Displays the full error stack trace when a task fails. Useful for debugging and identifying the root cause of errors.

### `--show-config`

- **Type:** `boolean`
- **Default:** `false`

Display the resolved configuration that will be used for task execution. Useful for debugging configuration issues.

### `--config-key`

- **Type:** `string`
- **Default:** `undefined`
- **Effective only with**: `--show-config`

Effective only with `--show-config` to specify a single configuration path to display, using dot/bracket notation (e.g., `project.workspaces[1].tasks.build`).
Useful for inspecting a specific part of the configuration.

```bash
nadle --show-config
```

### `--help`

- **Type:** `boolean`
- **Alias:** `-h`
- **Default:** `false`

Display help information about Nadle CLI usage and available commands.

```bash
nadle --help
```

### `--version`

- **Type:** `boolean`
- **Alias:** `-v`
- **Default:** `false`

Display the current version of Nadle.

## Common Options

These options can be configured both via CLI flags and in the configuration file.
When both are specified, CLI flags take precedence, allowing quick overrides without modifying the config file.

### `logLevel`

- **Type:** `'error' | 'warn' | 'info' | 'debug'`
- **Default:** `'log'`
- **CLI:** `--log-level <level>`

Set the logging verbosity level. Higher levels include all lower level logs.

### `implicitDependencies`

- **Type:** `boolean`
- **Default:** `true`
- **CLI:** `--implicit-dependencies`, `--no-implicit-dependencies`

Enables automatic task dependency edges based on workspace `package.json` relationships.
When enabled, if workspace `app` depends on workspace `lib` (via `workspace:*` protocol),
then `lib:build` will automatically run before `app:build` without needing explicit
`dependsOn` configuration.

Additionally, when a root task expands to include child workspace tasks, the root task
will automatically depend on all expanded children, ensuring it runs last.

Set to `false` to disable all implicit dependency behavior.

### `parallel`

- **Type:** `boolean`
- **Default:** `false`
- **CLI:** `--parallel`

Executes the specified tasks in parallel regardless of their order,
while still respecting their configured dependencies—unless a later task is a dependency of an earlier one.

### `footer`

- **Type:** `boolean`
- **Default:** `!isCI && isTTY`
- **CLI:** `--footer`, `--no-footer`

Displays real-time progress information during task execution.
Includes the number of scheduled tasks, running tasks, finished tasks, and other execution stats.
Useful for tracking task flow in complex or long-running builds.
Enabled by default when running in an interactive terminal (TTY) outside of CI.
Automatically disabled when output is piped or redirected.

### `reporter`

- **Type:** `'default' | 'agent'`
- **Default:** `'default'`
- **CLI:** `--reporter <default|agent>`

Selects the output style. `default` is the human-oriented reporter (welcome banner,
colored task status messages, optional live footer, optional summary table).

`agent` is a compact, plain reporter for AI agents and scripts: no colors, banner,
footer, or spinners — just one stable line per task (`DONE <task> <time>`,
`FAILED <task> <time>`, etc.) and a single summary line at the end
(`SUCCESS in <time> (done N ...)`). Lower token noise and deterministic, easy to parse.

### `summary`

- **Type:** `boolean`
- **Default:** `false`
- **CLI:** `--summary`, `--no-summary`

Prints profiling insights after all tasks have finished: a table of the slowest tasks
(sorted by duration), the **critical path** (the longest cumulative-duration
dependency chain that bounded the run), and **cache-miss hotspots** — the tasks that
executed, each with a suggestion (declare inputs & outputs to make it cacheable, or
note that an input changed).
Useful for identifying performance bottlenecks and optimizing build times.

### `maxWorkers`

- **Type:** `number | string`
- **Default:** `100% of CPUs - 1` (at least `1`)
- **CLI:** `--max-workers <number|string>`

Sets the **maximum number of worker threads** Nadle can use.
If unset, it defaults to the total number of cores minus one, ensuring at least one worker is always available.

You can provide:

- An exact number of workers (e.g., `4`)
- A percentage string (e.g., `75%`), which will be calculated based on the number of available CPU cores.

For instance: `75%` on a 16-core machine results in a maximum of 12 workers.

### `minWorkers`

- **Type:** `number | string`
- **Default:** number of CPU cores minus one (same as `maxWorkers`)
- **CLI:** `--min-workers <number>`

Specifies the **minimum number of worker threads** used for parallel task execution.
The final value will not exceed the resolved `maxWorkers`.

You can pass:

- An absolute number (e.g., `2`)
- A percentage string (e.g., `50%`), which will be interpreted as a percentage of the available CPU cores.

For example, on an 8-core machine, `50%` means at least 4 workers will be used.

### `cache`

- **Type:** `boolean`
- **Default:** `true`
- **CLI:** `--no-cache`, `--cache=false`

Disables the caching mechanism for all tasks in the current run.

When this flag is set, all tasks will be executed unconditionally, regardless of whether their inputs or outputs have changed.
This is useful in scenarios where the cache might be outdated, or when debugging and ensuring that all logic runs from scratch.

Use this flag to force fresh execution and bypass any cached results.

### `maxCacheEntries`

- **Type:** `number`
- **Default:** `5`

Sets the maximum number of cache entries kept per task. After each cache-miss save,
entries beyond this limit are automatically evicted (oldest first). This can also be
set per-task in the task configuration, which takes precedence over the global value.

```typescript
// Per-task override
tasks.register("build", {
	run: async () => {
		/* ... */
	},
	maxCacheEntries: 3,
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("dist")]
});
```

## Configuration File Example

Here's a complete example of a Nadle configuration file:

```typescript
// nadle.config.ts
import { configure } from "nadle";

configure({
	logLevel: "info",
	minWorkers: 2,
	maxWorkers: 4,
	footer: false
});
```

## Plugins

A plugin is a package that contributes task types, lifecycle hooks, and/or custom reporters
to your build. Author one with `definePlugin` and apply it in `nadle.config.ts` with `use`:

```ts
import { use } from "nadle";
import { myPlugin } from "my-nadle-plugin";

use(myPlugin, {
	/* plugin options (typed) */
});
```

`use(plugin, options?)` registers the plugin's task types (so they behave exactly like tasks
you register yourself, with full `inputs`/`outputs`/`dependsOn` config), records its options,
and wires its hooks. Applying the same plugin twice is a no-op if the options match and an
error if they differ.

### Authoring a plugin

```ts
import { definePlugin } from "nadle";

export const myPlugin = definePlugin<{ threshold?: number }>({
	name: "timing", // required, unique
	enforce: "post", // optional ordering: "pre" | "post"
	tasks: [
		{
			name: "deploy",
			task: DeployTask,
			config: {
				inputs: [
					/* … */
				]
			}
		}
	],
	hooks: {
		beforeAll: (ctx) => {
			/* once, before scheduling — throw to abort the run */
		},
		afterAll: (ctx) => {
			/* once, after the run settles — ctx.outcome is "success" | "failed" */
		},
		beforeTask: (ctx) => {
			/* a task is about to execute — NOT fired for cache hits */
		},
		afterTask: (ctx) => {
			/* a task settled — ctx.result: "done" | "failed" | "up-to-date" | "from-cache" | "canceled" */
		}
	}
});
```

All hooks are optional and run on the main thread. **`beforeTask` and `afterTask` are not a
guaranteed pair:** `beforeTask` fires only when a task actually executes (not for cache hits),
while `afterTask` fires for every terminal outcome. Treat `beforeTask` as "about to do real
work" and `afterTask` as "settled — check `result`". Hook ordering follows `enforce` (`pre`
plugins first, then normal, then `post`); errors thrown from `afterAll`/`beforeTask`/`afterTask`
are logged as warnings and never fail the run, while a throwing `beforeAll` aborts it.

### Custom reporters

A plugin can contribute a reporter (a `Listener`), selected with `--reporter <name>`:

```ts
export const jsonPlugin = definePlugin({
	name: "json-reporter",
	reporters: [{ name: "json", create: (context) => new JsonReporter(context.logger) }]
});
```

```bash
nadle build --reporter json
```

Exactly one reporter is active at a time (a plugin reporter replaces the default). A reporter
name may not shadow the built-in `default`/`agent`; an unknown `--reporter` name errors with
the list of available reporters.
