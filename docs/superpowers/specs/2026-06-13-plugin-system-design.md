# Plugin System Design (`definePlugin` / `use`)

**Status:** Draft for user review (self-driven brainstorm; revised after an adversarial self-review round).
**Issue:** [#641](https://github.com/nadlejs/nadle/issues/641) — plugins register task types, add config options, hook lifecycle (`beforeTask`/`afterTask`/`beforeAll`/`afterAll`). Core of the Distribution pillar: task types as shippable npm packages.

## Goal

Let a published npm package contribute, to a user's nadle build: (1) reusable **task
types**, (2) **lifecycle hooks** to observe a run and react before/after each task and
before/after the whole run, and (3) its own **named options** read from config. A plugin
is applied explicitly by the user in `nadle.config.ts` — no auto-discovery, no magic.

## Design pivot: everything runs on the main thread

An earlier draft put `beforeTask`/`afterTask` in the **worker thread** (to literally wrap
`task.run`). Review showed that carries almost all the risk — worker re-load semantics,
hooks-vs-cache-hit skip paths, per-worker shared state, and main/worker options desync —
for hooks whose realistic uses (timing, logging, notifications, metrics) are pure
**observation**. nadle's main thread already receives a full set of per-task events
(`onTaskStart`, `onTaskFinish`, `onTaskFailed`, `onTaskUpToDate`, `onTaskRestoreFromCache`)
via the `Listener` interface and `EventEmitter`. So:

**All four hooks are main-thread observers built on the existing event seam.** No worker
changes, no `WorkerParams`/`WorkerMessage` changes, no closure serialization, no
config-re-load reasoning. Running code *inside a task's worker process* (to mutate its env
or inspect process state) is a separate, harder capability deferred until a concrete use
case demands it (see Out of scope).

This makes the whole feature additive over `Listener` + `tasks.register` — the two seams
that already exist and are public.

## Plugin shape

A plugin is a plain object, built by an identity helper `definePlugin` (typing only,
mirroring `defineTask`). It is **applied**, never auto-discovered:

```ts
// my-plugin/index.ts  (a "nadle.plugin.ts" by convention — just where authors export it)
import { definePlugin } from "nadle";

export const myPlugin = definePlugin<{ threshold?: number }>({
  name: "timing",                    // required, unique; used for dedup + error messages

  // (1) task types this plugin contributes. Each entry is registered exactly as if the
  //     user wrote tasks.register(name, task, optionsResolver).config(config) — so a
  //     contributed task keeps the FULL config surface (inputs/outputs/dependsOn/…).
  tasks: [
    { name: "docker", task: DockerTask, optionsResolver: (ctx) => ({ /* … */ }), config: { /* inputs, outputs, … */ } }
  ],

  // (2) lifecycle hooks — all OPTIONAL, all main-thread, all observe-only (+ beforeAll may abort).
  hooks: {
    beforeAll:  (ctx) => { /* once, before scheduling. Throw to abort the run. */ },
    afterAll:   (ctx) => { /* once, after the run settles. ctx.outcome = "success" | "failed". */ },
    beforeTask: (ctx) => { /* a task is about to actually execute (NOT fired for cache hits). */ },
    afterTask:  (ctx) => { /* a task settled (any outcome). ctx.result says which. */ }
  },

  // (3) custom reporters this plugin contributes, keyed by the name users select via
  //     --reporter <name> (or reporter: "<name>" in config). A reporter is a Listener
  //     factory — exactly what DefaultReporter/AgentReporter already are.
  reporters: [
    { name: "json", create: (context) => new MyJsonReporter(context) }   // create returns a Listener
  ]
});
```

Applied in user config:

```ts
// nadle.config.ts
import { use } from "nadle";
import { myPlugin } from "my-plugin";

use(myPlugin, { threshold: 2000 });
```

There is **no open-ended `setup()`** (the earlier draft had one; it re-ran in every
process and was a footgun). Task contribution is declarative (`tasks: […]`); any one-time
main-thread initialization a plugin needs goes in `beforeAll`. Option validation happens
in `use()` if the plugin supplies a validator, or lazily in the hooks.

## `use(plugin, options?)`

The single public entry, called during config load:

1. **Validate** the plugin object shape (has a string `name`; `tasks`/`hooks` well-formed)
   → `ConfigurationError` on malformation.
2. **Dedup by `name`**: applying the same plugin again with **deep-equal options is a
   no-op** (supports a meta-plugin and the user both applying it); with **different
   options is an error** (ambiguous — last-wins would surprise). This rule survives the
   future plugin-composition feature.
3. **Register task types** through the real `tasks.register(name, task, resolver).config(config)`
   path, so contributed tasks get name validation, duplicate detection, and the full
   config builder — they are first-class, not second-class.
4. **Record** the plugin + its resolved options + its hooks in the `PluginRegistry`.

`use` reaches the registries through the config-load context (see Wiring).

### Why a free `use()` (not `tasks.use` / a config field)

`tasks.register` and `configure` are nadle's existing config verbs. `use(plugin)` reads
naturally and matches the ecosystem term ("use a plugin"). A `configure({ plugins: [...] })`
field was considered and rejected for v1: it muddles per-plugin options with global
options and orders plugins by array position rather than call site. (If a config-field form
is later wanted it can wrap `use`.) This is a deliberate, documented choice.

## Hook placement & semantics

All hooks are dispatched by an internal `PluginListener` that implements the existing
`Listener` interface; core registers it once when ≥1 applied plugin defines a hook.

| Hook         | Mapped from `Listener` event              | Context (`ctx`)                                              |
| ------------ | ----------------------------------------- | ------------------------------------------------------------ |
| `beforeAll`  | `onExecutionStart`                        | `{ pluginOptions, logger, tasks: RegisteredTask[] }`         |
| `afterAll`   | `onExecutionFinish` / `onExecutionFailed` | `{ pluginOptions, logger, outcome: "success" \| "failed", error? }` |
| `beforeTask` | `onTaskStart`                             | `{ pluginOptions, logger, task: RegisteredTask, threadId }`  |
| `afterTask`  | `onTaskFinish`/`onTaskFailed`/`onTaskUpToDate`/`onTaskRestoreFromCache`/`onTaskCanceled` | `{ pluginOptions, logger, task, result: "done" \| "failed" \| "up-to-date" \| "from-cache" \| "canceled", error? }` |

**`beforeTask` and `afterTask` are NOT a guaranteed pair.** `onTaskStart` (hence
`beforeTask`) fires only when a task **actually executes** — it is *not* emitted for tasks
served `up-to-date` or `from-cache` (the worker sends no `start` for those). `afterTask`,
by contrast, fires for **every** terminal outcome, including cache hits and cancellation.
So a cache-hit task gets an `afterTask` (`result: "up-to-date" | "from-cache"`) with **no**
preceding `beforeTask`, and a canceled task gets `afterTask` (`result: "canceled"`).
Plugin authors must therefore treat `beforeTask` as "about to do real work" and `afterTask`
as "settled (check `result`)", and must **not** assume a balanced bracket — open per-task
state in `beforeTask` only if you also tolerate `afterTask` firing alone. `threadId` is the
worker thread id (meaningless under the inline executor when `--max-workers=1`).

`pluginOptions` is the typed options that were passed to `use` for *this* plugin (the
`definePlugin<Options>` generic threads the type to every hook). `logger` is the core
logger (so plugin output is consistent and respects `--log-level`/reporter).

**Ordering:** `beforeAll`/`beforeTask` run in plugin-application order. `afterAll`/`afterTask`
run in **reverse** order (teardown wraps setup).

**Failure semantics (and how they're actually enforced — the emitter does not give these
for free):**
- A throwing **`beforeAll`** propagates out of `onExecutionStart`, which `nadle.ts` lets
  abort the run before scheduling (it exits via the normal error path). This is the one
  hook allowed to abort. `PluginListener` does **not** catch it.
- A throwing **`beforeTask`/`afterTask`** must **not** crash the run mid-flight, and a
  throwing **`afterAll`** must **not** turn a green run red (on the success path it would
  otherwise be caught by `nadle.ts`'s try/catch and re-routed into the failure path,
  double-firing it). So `PluginListener` **catches inside each of these methods** and
  downgrades the error to a logged warning (surfaced, never silently swallowed). Only
  `beforeAll` is allowed to escape.

**Listener insertion order:** `PluginListener` is added to the `EventEmitter` **after** the
reporter, so the reporter's `onExecutionStart` runs (banner, footer) before plugin
`beforeAll`, and a `beforeAll` abort happens with the reporter already initialized — giving
a clean error render rather than garbled state.

## Options determinism (a real hazard, called out)

Config is re-imported per process (main + each worker re-runs `nadle.config.ts`). Since all
plugin hooks now run **only on the main thread**, plugin options are read only there, so
the main/worker desync the earlier draft risked is gone for hooks. The remaining rule, same
as nadle's existing "no `process.cwd()` in core" determinism stance: **`use(plugin, opts)`
should pass deterministic options** — don't compute them from `Date.now()`/ambient state in
a way that differs across config re-loads, because contributed *task types* (which the
worker re-registers) read their behavior from config too. Documented as a constraint.

## Custom reporters (plugin-contributed)

A reporter in nadle is already just a `Listener` (`DefaultReporter`/`AgentReporter` both
implement it) selected by name at `nadle.ts:43`. Today the name space is a closed enum
(`SupportReporters = ["default", "agent"]`) and `options.reporter` is typed `SupportReporter`.
To let a plugin ship one:

- A plugin's `reporters: [{ name, create }]` entries register a **reporter factory**
  (`create(context) => Listener`) in the `PluginRegistry`, keyed by `name`.
- `options.reporter` becomes a plain `string` (not the closed enum). Resolution validates
  the requested name against the built-ins **plus** the registered plugin reporter names; an
  unknown name is a `ConfigurationError` listing the available reporters.
- At `nadle.ts:43`, instead of the `=== "agent"` branch, look the name up: built-in
  (`default`/`agent`) first, else a plugin factory, and `addListener(factory(this))`.
- Exactly **one** reporter is active (it replaces the default), unlike hooks which are
  additive. Selecting a plugin reporter swaps out `default`. (Plugins that merely want to
  observe should use hooks, not a reporter.)

Reporter names dedupe with built-ins: a plugin may not redefine `default`/`agent`
(`ConfigurationError`), and two plugins claiming the same reporter name is an error. This
reuses the same registry + the existing reporter seam — no new rendering machinery.

The `SupportReporter` type stays exported for back-compat but `reporter` widens to `string`;
the `--reporter` flag's `choices` validation moves from a static list to a runtime check
against registered names (so `--help` shows built-ins, and an unknown name errors clearly).

## Wiring (the change the contract needs)

The config-load seam (`runWithInstance` / `getCurrentInstance`) currently exposes only
`{ taskRegistry, fileOptionRegistry }`. `use()` needs a plugin registry there:

- **`NadleInstance`** (`core/nadle-context.ts`) gains `pluginRegistry: PluginRegistry`.
- **`Nadle`** constructs a `PluginRegistry` next to `taskRegistry` and passes it into
  `runWithInstance` for both `init` (main) and `initForWorker` (worker). The worker
  populates it from the re-loaded config exactly like `taskRegistry` — harmless there
  since hooks dispatch only on main; the worker just needs contributed task *types*
  registered, which already happens via the `tasks.register` path inside `use`.
- After config load, `Nadle` reads the registry: registers `PluginListener` if any hooks
  exist (contributed task types are already in `taskRegistry`).

This is the one non-obvious wiring change; it is small and mirrors how `fileOptionRegistry`
is already threaded.

## Architecture / files

- **`core/plugins/plugin.ts`** — `NadlePlugin<Options>`, `PluginHooks<Options>`, the four
  hook-context types, and `definePlugin` (identity helper).
- **`core/plugins/plugin-registry.ts`** — internal `PluginRegistry`: name→{plugin, options},
  dedup rule, ordered/reverse-ordered hook accessors.
- **`core/plugins/use.ts`** — public `use()`: validate, dedup, register task types via
  `tasks.register().config()`, record in the registry.
- **`core/plugins/plugin-listener.ts`** — internal `Listener` mapping events→hooks with the
  catch/downgrade semantics above.
- **`core/nadle-context.ts`** — add `pluginRegistry` to `NadleInstance`.
- **`core/nadle.ts`** — construct + thread the registry; register `PluginListener` after the
  reporter when hooks exist; (P3) replace the `reporter === "agent"` branch at `:43` with a
  registry-backed lookup (built-in → plugin factory).
- **`core/options/` resolver + `cli-options.ts`** (P3) — widen `reporter` to `string`;
  validate the requested name against built-ins + registered reporter names at resolve time.
- **`src/index.ts` / `core/index.ts`** — export `definePlugin`, `use`, and the public types.

No worker changes. No event-emitter changes. No `WorkerParams`/`WorkerMessage` changes.

## Public API additions (minimal, additive)

- `definePlugin<Options>(plugin): NadlePlugin<Options>`
- `use<Options>(plugin: NadlePlugin<Options>, options?: Options): void`
- types: `NadlePlugin<Options>`, `PluginHooks<Options>`, `RunHookContext`,
  `TaskHookContext`, and (P3) `PluginReporter` (`{ name: string; create: (context) => Listener }`).
- `reporter` option widens from `SupportReporter` to `string` (P3); `Listener` is already
  exported (reporters implement it). (`getCurrentInstance`/registries stay internal.)

## Testing

- **Unit `test/unit/plugin-registry.test.ts`**: dedup no-op on equal options; error on
  differing options; ordered vs reverse-ordered hook dispatch; the catch/downgrade rule
  (a throwing `afterTask`/`afterAll` does not fail the run; a throwing `beforeAll` does).
- **Unit `test/unit/use.test.ts`** (drive the real registry via `runWithInstance`, like the
  lazy-config test): `use` registers a contributed task type *with its config* (inputs/
  outputs visible); rejects a malformed plugin; threads typed options to hooks.
- **Integration `test/options/plugin.test.ts`**: a fixture config that `use()`s a small
  in-repo plugin contributing a task type + all four hooks; assert the task type runs, the
  hooks fire in order and observe the right results (a hook writes a marker the test reads),
  the contributed task's declared inputs make it cacheable on a second run, and the agent
  reporter shows completion. Second test: a plugin whose `beforeAll` throws aborts the run
  with a clear message and non-zero exit; a plugin whose `afterAll` throws still exits 0
  (warning logged).
- **Integration `test/options/plugin-reporter.test.ts`** (P3): a plugin contributes a `json`
  reporter; `--reporter json` selects it (output is the plugin's, not the default); an
  unknown `--reporter nope` errors listing available reporters; a plugin reusing `default`
  is a `ConfigurationError`.

## In scope but specced separately (sub-specs)

- **Auto-discovery** — applying plugins found in `node_modules` / a `nadle.plugin.ts`
  convention without an explicit `use()`, plus the `nadle add <plugin>` install flow
  (#644). It needs its own loader, ordering rules, and a `nadle plugins` listing, and it
  builds *on top of* the `use()` contract defined here. Captured in a linked sub-spec:
  `2026-06-13-plugin-auto-discovery-design.md` (its own plan/implementation cycle). The
  core contract here is the prerequisite.

## Out of scope (still deferred)

- **Worker-process hooks** — running plugin code *inside* a task's worker thread (to mutate
  its env, wrap `run()`, inspect process state). High risk (re-load semantics, cache-skip
  paths, per-worker state); no concrete use case yet. The four observe hooks cover what
  timing/logging/metrics/notification plugins need.
- **Mutating another task's declared config from a hook** — would desync main vs worker
  config views. Config stays declared in config.
- **Plugin-to-plugin dependencies / explicit ordering** beyond application order.

## Phasing

1. **P1 — contract + task types + run hooks**: `definePlugin`, `use`, `PluginRegistry`,
   context wiring, contributed task types (with full `.config()`), and `beforeAll`/`afterAll`
   via `PluginListener`. First useful slice; all main-thread.
2. **P2 — per-task hooks**: `beforeTask`/`afterTask` on the same `PluginListener` (more
   event mappings + the `afterTask` result discrimination). Small, additive.
3. **P3 — custom reporters**: `reporters: [{ name, create }]` registration; widen
   `options.reporter` to `string` with runtime name validation; swap the `nadle.ts:43`
   selection to a registry lookup. Self-contained, reuses the reporter seam.
4. **Auto-discovery** — separate sub-spec (`2026-06-13-plugin-auto-discovery-design.md`),
   built after P1–P3 land.

P1–P3 are low-risk and on existing seams. #641's acceptance (contract + loader, lifecycle
dispatch, docs + example) is met at the end of P2; P3 adds the reporter extension point;
auto-discovery follows in its own spec.
