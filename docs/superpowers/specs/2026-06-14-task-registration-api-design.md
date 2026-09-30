# Task Registration API Redesign

**Status:** Draft (pending user review).
**Scope:** The public task-registration API — `tasks.register()` and the
`.config()` builder. Breaking change to a 1.0-blocking surface; explicitly
authorized by the user ("can break").
**Related:** API freeze for 1.0 (#649). Sets up — but does not implement —
type-safe `dependsOn` (deferred pain point).

## Goal

Make task registration the most convenient form that covers **every** use case
with **one** mental model. Today the API encodes four orthogonal axes — name,
body, options, config — positionally across three `register` overloads plus a
conditional-tuple resolver, and a mandatory second `.config()` call for anything
beyond a bare task. The result: adjacency ambiguity (an options object and a
config object sit side by side, distinguished only by type), boilerplate
(`group:` repeated 16× in the self-host config), and a shape that static tooling
must AST-match.

This redesign replaces the positional encoding with a **single keyed spec
object**, keeps a **positional shorthand** for trivial tasks, and **removes
`.config()`**.

## The four axes (why today hurts)

A registration carries up to four independent things:

1. **name** — `"eslint"` (always present)
2. **body** — an inline `fn` _or_ a `Task` object (`PnpxTask`) _or_ nothing
   (aggregator / placeholder tasks like `check`)
3. **options** — the body's typed inputs (`{ command, args }`), only for `Task` bodies
4. **config** — graph + execution metadata (`group`, `description`, `dependsOn`,
   `inputs`, `outputs`, `env`, `workingDir`, `timeout`, `retries`,
   `maxCacheEntries`)

Today these are positional with overloads:

```ts
tasks.register("eslint", PnpxTask, { command: "eslint", args: [...] })
  .config({ group: "Checking", dependsOn: ["compile"], description: "Lint" });
```

`{ command, args }` (axis 3) and `{ group, dependsOn, ... }` (axis 4) are
adjacent objects; only their TS types tell them apart. Every non-trivial task
pays the two-call `.register().config()` tax.

## Surface

### Primary form — single keyed spec object

```ts
tasks.register("eslint", {
  run: PnpxTask,
  options: { command: "eslint", args: ["--quiet", "."] },
  group: "Checking",
  dependsOn: ["compile"],
  description: "Lint all files with ESLint",
});
```

One object. Every axis is a named, optional key. No adjacency ambiguity (`run`
and `options` are distinct keys from the config fields). No second call.

The spec object is `TaskSpec<Options>`. Its canonical definition is the
conditional `type` under [Type rules](#options-required-ness-strict) (the
required-ness of `run`/`options` depends on `Options`, which an `interface`
cannot express). Illustratively, it is `TaskConfiguration` plus two keys:

- `run?: TaskFn | Task<Options>` — inline function or a `Task` object. Omit for
  placeholder/aggregator tasks.
- `options?: Resolver<Options>` — a value OR a resolver thunk returning it
  (`Resolver<Options> = Options | (() => Options)`). Required/optional per the
  type rules. The thunk form subsumes the old `optionsResolver` positional, so
  options can be computed lazily without a separate axis.

`TaskConfiguration` already carries `group`, `description`, `dependsOn`,
`inputs`, `outputs`, `env`, `workingDir`, `timeout`, `retries`,
`maxCacheEntries` — all spread directly onto the spec.

### Shorthand forms (trivial tasks pay no object tax)

```ts
tasks.register("base");                       // name only — placeholder
tasks.register("hello", async () => { ... }); // name + inline fn
```

These are the two dead-common cases (the basic example is entirely these). The
shorthand is sugar for `{ }` and `{ run: fn }` respectively.

### All nine observed use cases, in the new API

| # | Case | New form |
|---|------|----------|
| 1 | name-only placeholder | `register("base")` |
| 2 | inline fn | `register("hello", fn)` |
| 3 | fn + config | `register("goodbye", { run: fn, group, dependsOn })` |
| 4 | Task + required options | `register("eslint", { run: PnpxTask, options })` |
| 5 | Task + options + config | `register("eslint", { run: PnpxTask, options, group, dependsOn })` |
| 6 | lazy config | `register("x", lazy(() => ({ run, options, env })))` — `lazy()`-wrapped spec thunk, see Lazy |
| 7 | optional options | `register("x", { run: MyTask })` — options optional per rules |
| 8 | programmatic/spread | `register("task-A", defineSpec({...}))` — returns a `TaskSpec` |
| 9 | context-using fn | `register("pwd", ({ context }) => ...)` — fn unchanged |

## Type rules

### Options required-ness (strict)

`options` is **mandatory iff** the body's `Options` type has required fields,
**optional/forbidden** otherwise. This preserves today's
`{} extends Options ? optional : required` guarantee, expressed as a single
keyed field via a conditional mapped type rather than a conditional tuple:

```ts
type TaskSpec<Options> =
  TaskConfiguration &
  ({} extends Options
    ? { run?: TaskFn | Task<Options>; options?: Resolver<Options> }
    : { run: Task<Options>; options: Resolver<Options> });

// register's eager spec argument is the spec itself (the bare-thunk form is
// dropped — deferral is opt-in via lazy(), see Lazy configuration):
type SpecArg<Options> = TaskSpec<Options>;
```

- Body is `void`/no options → `options` may be omitted.
- Body is `Task<{ command: string }>` → `options` is required and type-checked
  (value or a `() => { command: string }` thunk).
- Inline `fn` body → `options` forbidden (a function takes no nadle options).

### `run` vs config-field collision

`TaskConfiguration` has no `run` or `options` keys today (verified), so the
intersection is conflict-free. The spec adds a **reserved-key guarantee**:
`run` and `options` are reserved and may never be added to `TaskConfiguration`.

## Lazy configuration

Today `.config()` accepts a callback for deferred config (#675 memoizes it). The
keyed form keeps one — and only one — whole-spec deferral mechanism, but it is
**opt-in via an explicit `lazy()` wrapper** rather than a bare thunk:

```ts
// whole spec deferred via lazy()
tasks.register("secondTask", lazy(() => ({
  run: MyTask,
  options: {},
  env: { SECOND_TASK_ENV: "..." },
})));
```

`lazy(thunk)` returns a branded `LazySpec<Options>` — an object tagged with a
private symbol that wraps the spec thunk. `register` has a dedicated overload for
it. A bare `() => TaskSpec` thunk is **not** accepted as the spec argument; the
explicit tag is required.

Why a tagged wrapper instead of a bare thunk: a bare function argument is
ambiguous against the inline-function body shorthand (`register(name, fn)`) —
both are `(…) => …`, and only the return type distinguishes a config thunk from a
task body, which is brittle for both readers and static tooling. The `lazy()` tag
makes the deferral intent explicit and unambiguous at the call site and in the
AST.

So `register`'s second argument is `TaskFn | TaskSpec<Options> | LazySpec<Options>`
(plus the name-only form). The wrapped thunk is invoked at most once (same
memoization as #675), keeping lazy work (which "can do real work, read several
times per run") out of the registration hot path. An eager spec object resolves
synchronously.

There are exactly two deferral points, no overlap: **the whole spec** (via
`lazy()`, for config that must be computed at resolve time) and **`options`** (a
`Resolver<Options>`, for a `Task` body whose options are computed). There is no
separate `config:` key — config fields live directly on the spec.

## Removal of `.config()`

`.config()` and the `TaskConfigurationBuilder` interface are **removed**.
`register()` returns `void` (was `TaskConfigurationBuilder`). This eliminates the
two-call pattern, the builder-only-exists-to-host-config wart, and the
re-`register()` swap inside the current implementation (`api.ts:103-108`).

Rationale for full removal over deprecation: the user authorized breaking
changes; keeping both doubles the API surface that downstream tooling must match
and contradicts "one mental model." A codemod (below) makes migration
mechanical.

## Side effects — exhaustive resolution

The current `.register().config()` shape is a contract consumed by **five
subsystems**, several via AST-matching that ignores TS types. Each must be
updated in the same change set.

### 1. Core (`packages/nadle/src/core/registration/`)
- `api.ts` — replace 3 overloads + builder with: two shorthand overloads
  (`register(name)`, `register(name, fn)`) + the keyed form
  (`register(name, spec)`) + the `lazy()` form (`register(name, LazySpec)`).
  Collapse the internal re-`register()` swap: config is now known at call time
  (or via a `lazy()`-wrapped spec, resolved at most once), so `register` runs
  once. Add `lazy()` (the tagged-wrapper factory) and the `LazySpec`/`SpecArg`
  types.
- `define-task.ts` — `defineTask` keeps returning a `Task<Options>` (body only);
  unaffected. Add a `defineSpec` helper (mirrors `defineTask`/`definePlugin`)
  for case #8 (programmatic specs) so spread sites get a typed spec instead of
  tuple spread.
- `TasksAPI` / `TaskConfigurationBuilder` — `TaskConfigurationBuilder` deleted;
  `TasksAPI.register` retyped. New exports: `TaskSpec`, `SpecArg`, `LazySpec`,
  `lazy`, `defineSpec`.

### 2. eslint-plugin (11 rules, `ast-helpers.ts`)
AST-matchers keyed on `CallExpression` `register(...).config(...)` must be
rewritten to match `register(name, spec)`:
- `ast-helpers.ts` — central matcher: find the spec object argument instead of
  walking `.config()` member-expression chains.
- `valid-depends-on`, `no-circular-dependencies` — read `dependsOn` from the
  spec object's `dependsOn` property (was the `.config()` arg).
- `require-task-description`, `require-task-inputs` — read `description`/`inputs`
  keys from the spec object.
- `no-anonymous-tasks`, `prefer-builtin-task` — read `run` key (was the 2nd
  positional).
- `padding-between-tasks` — the rule keys on `register` statements; the
  single-call form changes the node shape it pads around. Update spacing logic.
- `valid-task-name`, `no-duplicate-task-names`, `no-process-cwd`,
  `no-sync-in-task-action` — verify against the new shape; likely minor.
- All 11 rule test files + fixtures updated.

### 3. language-server
- `document-symbols.ts` — extracts task name + metadata from the call AST;
  retarget to the spec object.
- analyzer + 6 `__fixtures__/*.ts` (valid, duplicates, unresolved-deps,
  workspace-deps, dynamic-names, invalid-names, workspace-lib) rewritten.
- `analyzer.test.ts`, `document-store.test.ts` updated.

### 4. create-nadle
- `generate.ts` — scaffolds the API form into new projects; emit the keyed/
  shorthand form.

### 5. Tests, fixtures, examples, docs
- ~60 `nadle.config.ts` fixtures + `__configs__/*.ts` + `test/__setup__/
  config-builder.ts` migrated.
- `test/types/register.test-d.ts`, `define-task.test-d.ts` — rewritten to assert
  the new conditional-options typing and reserved-key behavior.
- `examples/basic`, `sample-app`, `docs/nadle.config.ts`, `vscode-extension`,
  self-host `nadle.config.ts` migrated.
- `packages/docs/` concept + reference pages, all snippets.
- `packages/nadle/index.api.md` — regenerated (API surface change).

### 6. Migration tooling
A **codemod** (ts-morph or jscodeshift) ships with the change to mechanically
rewrite `register(a, b, c).config(d)` → `register(a, { run: b, options: c, ...d })`,
handling: name-only, fn, Task+options, `.config(obj)`, `.config(callback)`
(→ `lazy()`-wrapped spec `register(a, lazy(() => ({ run: b, options: c, ...d })))`),
and tuple-spread (`register(...x)`). Documented in the
migration guide. The repo's own ~60 fixtures are the codemod's first test corpus.

### 7. Spec (`spec/`) — language-agnostic
`spec/` describes registration concepts (a task has a name, body, options,
config). The keyed-vs-positional encoding is a *language binding* detail, so
core `spec/` prose likely needs only light edits, but: add a `spec/CHANGELOG.md`
entry, bump `spec/README.md` version (**major** — breaking), and reconcile any
spec example that shows the old call shape. Done first, per the spec-driven
workflow.

## Limitations & extensibility

The keyed spec is net-positive for extensibility — it **converges** the public
API with the existing plugin shape (`PluginTask` is already
`{ name, task, config?, optionsResolver? }`), so one `TaskSpec` type can back
both. But three constraints are called out explicitly so future work isn't
surprised.

### Resolved in this design

- **Lazy/computed options (was a dropped axis).** The current public API and
  `PluginTask` both expose `optionsResolver` (`Resolver<T> = T | (() => T)`). An
  earlier draft of this spec dropped it. Fixed: `options` now accepts
  `Resolver<Options>` (value **or** thunk), subsuming `optionsResolver` into one
  key rather than a separate positional/field. `computeTaskInfo` already
  normalizes value-or-thunk (`api.ts:121`), so the runtime is unchanged.

- **Plugin per-task metadata (flat-namespace extension point).** `TaskSpec`
  flattens body + options + ~10 config fields into one object. Without a plan,
  a plugin wanting to attach task-level metadata (e.g. a cache policy, tags) has
  nowhere typed to put it. **Decision:** plugins extend `TaskConfiguration` via
  **TypeScript declaration merging** (module augmentation of the
  `TaskConfiguration` interface) under a plugin-namespaced key, not by adding
  bare top-level keys. The reserved-key set (`run`, `options`) is documented so
  augmentation can never shadow the body axes. This keeps the flat ergonomics
  for users while giving plugins a sound, collision-resistant typed slot.

### Out of scope — a model constraint, not an API-shape one

- **Type-safe `dependsOn` is blocked by the imperative registration model, not
  by this object shape.** A `TaskName` union for `dependsOn` would need all task
  names known at type-check time. Tasks register imperatively top-to-bottom, and
  cross-workspace refs (`pkg:build`, `//root:build`) are not local names — so a
  "names-seen-so-far" union cannot cover forward or cross-workspace deps. The
  keyed object makes `dependsOn` the natural home for such a type *later*, but
  achieving it likely requires a declaration-model shift (collect-then-resolve),
  designed separately. This redesign neither solves nor worsens it.

## Alternatives considered

- **Gradle trailing closure** — `register(name, body, options, (t) => {...})`.
  Closest to the namesake and resolves adjacency (a function ≠ an options
  object). Rejected as primary: keeps name/body/options positional, so the
  spread case (#8) and optional-options conditional (#7) stay awkward — it fixes
  the symptom (ambiguity), not the root (positional encoding of 4 axes).
- **Single options-bag with `run`/`options` merged flat into config** (Nx-style,
  no nested `options`). Rejected: mixing the body's option namespace with task
  config in one flat namespace invites key collisions and weakens the typed
  `options` story. The nested `options` key keeps the two namespaces clean while
  staying one object.
- **Deprecate `.config()` instead of removing.** Rejected: doubles the surface
  static tooling must match, against "one mental model"; breaking is authorized
  and a codemod covers migration.

## Open questions (resolved)

- *Lazy form?* → opt-in via an explicit `lazy(() => TaskSpec)` tagged wrapper
  (`LazySpec`), memoized; the only whole-spec deferral path. A bare thunk is not
  accepted (ambiguous against the inline-fn shorthand). No separate `config:` key.
- *Trivial-task tax?* → `register(name)` / `register(name, fn)` shorthands kept.
- *Options strictness?* → required iff `Options` has required fields (conditional
  mapped type).
- *`.config()` fate?* → removed; codemod migrates.
- *Lazy/computed options?* → `options` accepts `Resolver<Options>` (value or
  thunk); subsumes the old `optionsResolver` axis.
- *Plugin per-task metadata?* → declaration-merging `TaskConfiguration` under a
  namespaced key; `run`/`options` reserved.

## Out of scope (future specs)

- **Type-safe `dependsOn`** (reference real task names, autocomplete,
  compile-time existence). The keyed spec is a prerequisite — `dependsOn` is now
  a named key on a typed object, the natural home for a `TaskName` union later —
  but typing it is a separate, larger effort.
- **Group/namespace ergonomics** (declare a group once; attach tasks). Separate
  pain point, deferred by the user earlier.
