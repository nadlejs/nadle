---
description: Write a Nadle plugin with definePlugin — contribute task types, lifecycle hooks, and custom reporters, with typed options.
keywords: [nadle, plugin, definePlugin, authoring, lifecycle hooks, reporter, optionsResolver]
---

# Authoring a Plugin

A plugin packages reusable behavior so other projects can enable it with a single
[`use()`](../concepts/plugin.md#applying-a-plugin) call. Author one with the
`definePlugin` helper, which gives you full type inference for the plugin's
options.

```ts
import { definePlugin } from "nadle";

export const timingPlugin = definePlugin<{ threshold?: number }>({
	name: "timing", // required, unique
	enforce: "post", // optional: "pre" | "post"
	hooks: {
		afterTask: ({ task, result, pluginOptions, logger }) => {
			if (result === "done") {
				logger.log(`${task.label} finished (threshold ${pluginOptions.threshold ?? 0}ms)`);
			}
		}
	}
});
```

The `Options` generic flows to every hook as `pluginOptions`, so consumers get a
typed `use(timingPlugin, { threshold: 200 })`.

---

## Contributing task types

List ready-made tasks under `tasks`. Each entry is registered through the same
path as a hand-written `tasks.register(...).config(...)`, so contributed tasks
have the full configuration surface (`inputs`, `outputs`, `dependsOn`, `group`, …).

```ts
import { definePlugin, defineTask } from "nadle";

const DeployTask = defineTask<{ target: string }>({
	async run({ options, context }) {
		context.logger.log(`Deploying to ${options.target}`);
	}
});

export const deployPlugin = definePlugin({
	name: "deploy",
	tasks: [
		{
			name: "deploy",
			task: DeployTask,
			optionsResolver: () => ({ target: "production" }),
			config: { dependsOn: ["build"], group: "Release" }
		}
	]
});
```

- `task` — the task definition produced by [`defineTask`](./defining-task.md).
- `optionsResolver` — supplies the task's options (omit for option-less tasks).
- `config` — optional task configuration, identical to what
  [`.config()`](./configuring-task.md) accepts.

---

## Lifecycle hooks

All four hooks are optional and run on the main thread:

```ts
hooks: {
	beforeAll: ({ tasks, logger }) => {
		// once, before scheduling — throw to abort the run
	},
	afterAll: ({ outcome, error, logger }) => {
		// once, after the run settles; outcome is "success" | "failed"
	},
	beforeTask: ({ task, threadId }) => {
		// a task is about to execute — NOT fired for cache hits
	},
	afterTask: ({ task, result, error }) => {
		// a task settled — result: "done" | "failed" | "up-to-date" | "from-cache" | "canceled"
	}
}
```

Key rules:

- **`beforeTask`/`afterTask` are not a guaranteed pair.** `beforeTask` is skipped
  for cache hits; `afterTask` always fires. Branch on `result` in `afterTask`.
- **Only `beforeAll` can abort.** Throwing from `beforeAll` fails the run.
  Errors from `afterAll`/`beforeTask`/`afterTask` are downgraded to warnings.
- **Ordering** follows `enforce`: `"pre"` plugins first, then normal, then
  `"post"`; application order is preserved within each group.

### Hook context

| Field           | `beforeAll`/`afterAll` | `beforeTask`/`afterTask` |
| --------------- | ---------------------- | ------------------------ |
| `logger`        | yes                    | yes                      |
| `pluginOptions` | yes                    | yes                      |
| `tasks`         | yes                    | —                        |
| `outcome`       | `afterAll` only        | —                        |
| `task`          | —                      | yes                      |
| `threadId`      | —                      | `beforeTask` only        |
| `result`        | —                      | `afterTask` only         |
| `error`         | `afterAll` (failed)    | `afterTask` (failed)     |

---

## Custom reporters

A reporter is a `Listener` factory selectable with `--reporter <name>`:

```ts
export const jsonPlugin = definePlugin({
	name: "json-reporter",
	reporters: [
		{
			name: "json",
			create: ({ logger }) => ({
				onTaskFinish: (task) => logger.log(JSON.stringify({ task: task.label, status: "done" }))
			})
		}
	]
});
```

```bash
nadle build --reporter json
```

A reporter name may not shadow the built-in `default`/`agent`, and selecting an
unknown name errors with the list of available reporters. Exactly one reporter is
active per run. See [Reporting concepts](../config-reference.md#plugins) and the
[`Listener` events](../config-reference.md) for the methods a reporter can implement.

---

## Distributing

Publish the plugin as a normal npm package whose entry exports the
`definePlugin(...)` result. Consumers install it and call `use()`:

```ts
import { use } from "nadle";
import { deployPlugin } from "@acme/nadle-deploy";

use(deployPlugin);
```
