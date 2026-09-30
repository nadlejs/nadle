---
description: Understand Nadle plugins — distributable units that contribute task types, lifecycle hooks, and custom reporters, applied explicitly with use().
keywords: [nadle, plugin, definePlugin, use, lifecycle hooks, reporter, distribution]
---

# Plugin

A **plugin** is a distributable unit of behavior that a build opts into
explicitly. A plugin can contribute three things:

- **Task types** — ready-made tasks (e.g. a `deploy` task) that behave exactly
  like tasks you register yourself.
- **Lifecycle hooks** — callbacks that run around the build and around each task.
- **Custom reporters** — alternative output formats selectable with
  `--reporter <name>`.

Plugins are how capabilities are shared across projects: a published package
contributes the capability, and each project enables it with a single `use()`
call in its config. Unlike implicit auto-loading, nothing runs until you opt in.

## Applying a plugin

Apply a plugin in `nadle.config.ts` with `use(plugin, options?)`:

```ts
import { use } from "nadle";
import { myPlugin } from "my-nadle-plugin";

use(myPlugin, { threshold: 200 });
```

`use()` registers the plugin's task types, records its options, registers its
reporters, and wires its hooks. It is only valid from a configuration file.

Applying the same plugin twice is a **no-op when the options match** and an
**error when they differ** — so a project and a meta-plugin can both apply the
same plugin without conflict.

## Lifecycle hooks

A plugin can react to the build through four optional hooks, all of which run on
the main thread:

| Hook         | When it fires                                         |
| ------------ | ----------------------------------------------------- |
| `beforeAll`  | Once, before scheduling. Throwing aborts the run.     |
| `afterAll`   | Once, after the run settles (success or failure).     |
| `beforeTask` | Before a task executes. **Not fired for cache hits.** |
| `afterTask`  | After a task settles, for every outcome.              |

`beforeTask` and `afterTask` are **not a guaranteed pair**: `beforeTask` is
skipped for cache hits while `afterTask` always fires. Treat `beforeTask` as
"about to do real work" and `afterTask` as "settled — inspect `result`".

Errors from `afterAll`, `beforeTask`, and `afterTask` are logged as warnings and
never fail the run; only a throwing `beforeAll` aborts it.

Multiple plugins run in application order, grouped by an optional `enforce`
(`"pre"` plugins first, then normal, then `"post"`).

## Next steps

- [Authoring a plugin](../guides/authoring-plugin.md) — write your own plugin.
- [Config reference → Plugins](../config-reference.md#plugins) — full field reference.
