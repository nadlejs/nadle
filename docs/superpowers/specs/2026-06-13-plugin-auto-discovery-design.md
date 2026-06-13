# Plugin Auto-Discovery & `nadle add` Design (sub-spec)

**Status:** Draft for user review. **Sub-spec of** the plugin system
([2026-06-13-plugin-system-design.md](./2026-06-13-plugin-system-design.md)) — depends on
its `definePlugin` / `use` / `PluginRegistry` contract landing first (P1–P3).
**Issues:** [#641](https://github.com/nadlejs/nadle/issues/641) (plugin convention),
[#644](https://github.com/nadlejs/nadle/issues/644) (`nadle add <plugin>`).

## Goal

Reduce the boilerplate of wiring every plugin by hand. Two complementary pieces:

1. **Discovery** — apply installed plugins without each requiring an explicit `use()` in
   `nadle.config.ts`.
2. **Install flow** — `nadle add <plugin>` installs the package and registers it for
   discovery in one step.

The explicit `use()` from the core spec **remains the foundation and the escape hatch**;
discovery is a convenience layer on top, never a replacement. A user can always fall back
to `use()` for full control (order, options, conditional application).

## Why this is a sub-spec, not core

Discovery introduces things the core contract deliberately avoids: implicit application
(plugins running without an explicit call), filesystem/`node_modules` scanning, and an
ordering policy when nobody wrote the order down. Those deserve isolated design + their own
risk budget. The core spec ships first and stands alone; this rides on it.

## Discovery model (the key decision)

**Manifest-driven, not magic-scan.** Nadle does NOT crawl `node_modules` for anything that
looks like a plugin (slow, non-deterministic, security-surprising). Instead a single
declared list drives discovery:

- A `nadle` field in the root `package.json` (or a `nadle.plugins.ts`/JSON manifest):
  ```jsonc
  { "nadle": { "plugins": ["@nadle/plugin-vitest", "@acme/docker", ["@acme/foo", { "opt": 1 }]] } }
  ```
- Each entry is a package name (optionally `[name, options]`). At config-load, **before**
  reading `nadle.config.ts`, nadle imports each listed package, expects its default (or
  named `plugin`) export to be a `NadlePlugin`, and applies it via the same internal path
  `use()` uses — in **listed order**, before any `use()` calls in config (so config can
  still `use()` more, or rely on dedup to pass per-call options).

This keeps discovery **explicit and ordered** (the list is the source of truth) while
removing the per-plugin `import { x } from … ; use(x)` boilerplate. It is deterministic and
greppable — no hidden behavior from merely having a package installed.

### The `nadle.plugin.ts` convention's role

`nadle.plugin.ts` is the file a plugin **author** writes (`export default definePlugin(…)`).
Discovery resolves a listed package to its plugin export; if the package ships a
`nadle.plugin.ts` entry (via its `package.json` `exports`), that is what gets imported. The
convention is about where authors put the export, not a scan target.

## `nadle add <plugin>`

A new CLI command (its own handler, before the default Execute in the chain — it does not
run tasks):

1. Resolve + install the package with the project's package manager (detected via the
   existing `project.packageManager`): `pnpm add -D <plugin>` / `npm i -D` / `yarn add -D`.
2. Add the package name to the `nadle.plugins` manifest list (root `package.json`),
   idempotently (no-op if present).
3. Print a confirmation + any post-install notes the plugin declares.

`nadle add` is the on-ramp; discovery is what makes the added plugin take effect on the next
run. Removal: `nadle remove <plugin>` (symmetric) — optional, can follow.

## Discovery ordering & dedup

- Manifest plugins apply first, in list order; then config `use()` calls, in source order.
- The core spec's dedup rule carries over: same plugin + deep-equal options = no-op (so a
  manifest entry and a config `use()` with the same options coexist); different options =
  error. So a user can list a plugin in the manifest *and* `use()` it with explicit options
  only if the options match — otherwise they pick one place. Documented.
- An entry that fails to import or whose export is not a `NadlePlugin` is a
  `ConfigurationError` naming the offending package (fail fast, not silent skip).

## `nadle plugins` listing

A read-only handler that prints the resolved, ordered plugin set (name, source =
manifest|config, options summary, contributed task types / reporters / hooks). Useful for
debugging "why is this task type available / this hook firing." Trivial once the registry
exists.

## Architecture / files

- **`core/plugins/discovery.ts`** — read the manifest, import each package, apply via the
  shared internal `applyPlugin` (factored out of `use()` in the core spec), before config
  load. Runs in main **and** worker (worker needs contributed task types too) — same
  re-load reasoning as the core spec; deterministic because the manifest is static.
- **`core/handlers/add-handler.ts`** — `nadle add` (+ optional `remove`): package-manager
  shell-out + manifest edit.
- **`core/handlers/plugins-handler.ts`** — `nadle plugins` listing.
- **`core/handlers/index.ts`** — register the new handlers before Execute.
- **`project-resolver`** — surface the `nadle.plugins` manifest field when discovering the
  project (it already reads root `package.json`).

## Out of scope (even for this sub-spec)

- Magic `node_modules` scanning with no manifest entry.
- Version/compatibility resolution between plugins.
- A plugin registry/marketplace beyond npm.
- Worker-process hooks (still deferred in the core spec).

## Testing

- **Unit**: manifest parsing (string vs `[name, options]` entries; malformed → error);
  ordering (manifest before config); dedup interaction.
- **Integration**: a fixture with a `nadle.plugins` entry pointing at an in-repo plugin
  package; assert its task type is available with **no** `use()` in config; `nadle plugins`
  lists it; an unknown/ malformed entry errors clearly. `nadle add` is tested against a
  local tarball/in-repo package to avoid network (assert manifest edit + install invocation,
  mocking the package-manager call).

## Phasing

1. **Discovery** — manifest read + `applyPlugin` reuse + `nadle plugins` listing.
2. **`nadle add` / `remove`** — the install on-ramp.

Both ride on the core plugin contract; neither touches the worker boundary.
