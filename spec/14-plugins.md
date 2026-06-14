# 14 — Plugins

A plugin is a unit of distributable behavior that a build opts into explicitly. A
plugin may contribute **task types**, **lifecycle hooks**, and **custom reporters**.
Plugins are the extension seam of the Distribution pillar: a published package
contributes capabilities, and a project enables them by calling `use()` in its
configuration.

## Plugin Model

A plugin is an object with the following shape:

| Field       | Required | Description                                                                                   |
| ----------- | -------- | --------------------------------------------------------------------------------------------- |
| `name`      | yes      | Unique, non-empty string. Identifies the plugin for deduplication and error reports.          |
| `enforce`   | no       | Ordering hint: `"pre"` or `"post"`. Omitted means normal ordering.                            |
| `hooks`     | no       | Lifecycle hooks (see [Lifecycle Hooks](#lifecycle-hooks)).                                    |
| `tasks`     | no       | Task types contributed by the plugin (see [Contributed Task Types](#contributed-task-types)). |
| `reporters` | no       | Custom reporters contributed by the plugin (see [Custom Reporters](#custom-reporters)).       |

A plugin is generic over its `Options` type. The options value supplied when the
plugin is applied is passed back to every hook via the hook context.

The authoring helper `definePlugin(plugin)` is an identity function that exists
only to provide type inference for the `Options` generic; it returns the plugin
unchanged. It is the plugin analogue of `defineTask`.

## Applying a Plugin

A plugin is applied with `use(plugin, options?)`. This call is only valid from a
configuration file during the configuration-loading phase (see
[08-configuration-loading.md](08-configuration-loading.md)).

`use()` performs, in order:

1. **Validation.** If `plugin` is not an object, is `null`, or has a `name` that
   is not a non-empty string, a configuration error is raised.
2. **Registration.** The plugin is recorded in the per-instance plugin registry,
   its reporters are registered, and its options are stored.
3. **Task contribution.** Each entry in `plugin.tasks` is registered through the
   normal task-registration path.

### Deduplication

Plugins are keyed by `name`:

- **Same name + structurally equal options** — the second `use()` is a silent
  no-op. This allows a project and a meta-plugin to both apply the same plugin.
- **Same name + differing options** — a configuration error is raised.

Option equality is a deep, key-order-insensitive structural comparison:
primitives by identity, objects by matching key sets and recursively equal
values, arrays by length and element-wise equality.

## Lifecycle Hooks

A plugin's `hooks` object may define any of four hooks. All hooks are optional,
run on the **main thread**, and may be async. They are dispatched over the same
event seam described in [11-events.md](11-events.md).

| Hook         | Fires                                                          | Context           |
| ------------ | -------------------------------------------------------------- | ----------------- |
| `beforeAll`  | Once, before scheduling.                                       | `RunHookContext`  |
| `afterAll`   | Once, after the run settles (success or failure).              | `RunHookContext`  |
| `beforeTask` | Before a task actually executes. **Not fired for cache hits.** | `TaskHookContext` |
| `afterTask`  | After a task settles, for **every** terminal outcome.          | `TaskHookContext` |

### Pairing and outcomes

Because `beforeTask` is skipped for cache hits while `afterTask` always fires,
the two are **not a guaranteed pair**. Treat `beforeTask` as "about to do real
work" and `afterTask` as "settled — inspect `result`". `afterTask`'s `result` is
one of `"done"`, `"failed"`, `"up-to-date"`, `"from-cache"`, or `"canceled"`.
`afterAll`'s `outcome` is `"success"` or `"failed"`.

### Error semantics

- A throwing `beforeAll` **aborts the run** — it is the only hook whose error
  propagates.
- Errors thrown from `afterAll`, `beforeTask`, or `afterTask` are **downgraded to
  warnings** and never turn a settled run red.

### Ordering

Hooks execute in plugin order, grouped by `enforce`: all `"pre"` plugins first,
then plugins with no `enforce`, then all `"post"` plugins. Within a group, the
order of application (the order of `use()` calls) is preserved (stable).

### Hook context

`RunHookContext` provides: `logger`, `pluginOptions` (the options this plugin was
applied with), `tasks` (the tasks scheduled for the run), and — in `afterAll`
only — `outcome` and (when failed) `error`.

`TaskHookContext` provides: `logger`, `pluginOptions`, `task` (the task the hook
fires for), and either `threadId` (in `beforeTask`) or `result` and (when failed)
`error` (in `afterTask`).

## Contributed Task Types

Each entry in `plugin.tasks` has the shape:

| Field             | Required | Description                                                       |
| ----------------- | -------- | ----------------------------------------------------------------- |
| `name`            | yes      | Name the task is registered and invoked under.                    |
| `task`            | yes      | The task definition (as produced by `defineTask`).                |
| `optionsResolver` | no       | Resolver supplying the task's options.                            |
| `config`          | no       | Task configuration (`inputs`/`outputs`/`dependsOn`/`group`/etc.). |

Contributed tasks are routed through the same registration path as user-defined
tasks — a name, a task body, an optional options resolver, and an optional
configuration — so they have the full task configuration surface and behave
identically to hand-registered tasks. See [01-task.md](01-task.md) and
[02-task-configuration.md](02-task-configuration.md).

## Custom Reporters

Each entry in `plugin.reporters` has the shape:

| Field    | Required | Description                                            |
| -------- | -------- | ------------------------------------------------------ |
| `name`   | yes      | Name selected via `--reporter <name>`.                 |
| `create` | yes      | Factory `(context) => Listener` building the reporter. |

The factory receives a `ReporterContext` whose single field is `logger` (the core
logger, respecting `--log-level`). It returns a `Listener` (see
[11-events.md](11-events.md)).

A reporter name may not shadow a built-in (`default`, `agent`) and may not
collide with an already-registered reporter — either is a configuration error at
registration time. Selecting an unknown `--reporter` name is a configuration
error that lists the available reporters. Exactly one reporter is active per run;
a plugin reporter replaces the default. See [13-reporting.md](13-reporting.md).

## Scope

The plugin registry is **per Nadle instance**. Plugins applied in one run do not
leak into another.
