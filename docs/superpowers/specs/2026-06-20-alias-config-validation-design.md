# Alias config validation (#698)

## Problem

`configure({ alias })` accepts an object map or a function mapping workspace paths to
display labels. Today only the **shape** is validated (`assertAlias` in
`file-options-validator.ts` checks object-or-function). Three semantic mistakes were
called out in #698:

1. duplicate aliases mapping different workspaces to the same label,
2. an alias colliding with a real workspace ID,
3. an alias key for a path that matches no workspace.

## Finding: 2 of 3 already validated

`validateWorkspaceLabels` (`packages/kernel/src/workspace-resolver.ts`) runs in
`configureProject` **after** aliases are applied, and already throws on:

- **duplicate label** (case 1) — two workspaces ending up with the same non-empty label,
- **label collides with another workspace's ID** (case 2).

It works for both object- and function-style aliases because it inspects the resolved
labels, not the raw alias input.

The only real gap is **case 3**: an object alias key like `{ "packages/nope": "x" }` where
`packages/nope` is not a workspace. `createAliasResolver` simply never matches that key, so
the typo is silently ignored — no label applied, no error.

## Scope

- **Case 3 only** needs new code. Cases 1 and 2 need tests (characterization), not code.
- **Object-style only.** A function alias is invoked per *known* workspace path, so a
  "non-existent path" never arises — there is no enumerable key set to validate.
- The root workspace's relative path is `"."`; `{ ".": "my-root" }` is a valid root alias
  and must keep working. Valid key set = `"."` plus every sub-workspace `relativePath`.

## Design

### New unit — `validateAliasKeys(aliasOption, workspaces)`

Location: `packages/kernel/src/workspace-resolver.ts`, beside `validateWorkspaceLabels`
(kernel is zero-dependency; throws a plain `Error` like its siblings).

- No-op when `aliasOption` is `undefined` or a function.
- For an object: every key must equal a known workspace `relativePath` (root's `"."` or a
  sub-workspace's). Any key matching none throws:
  `Alias key "<key>" does not match any workspace. Known paths: <comma-list>`.
- Pure and independently testable: inputs are the alias keys and the set of known relative
  paths; no side effects.

### Wiring

`configureProject` (`packages/project-resolver/src/project-helpers.ts`) calls
`validateAliasKeys(aliasOption, getAllWorkspaces(project))` **before**
`createAliasResolver`, so a typo'd key fails fast — before label resolution and before the
existing post-resolution `validateWorkspaceLabels`.

### Data flow

```
discoverProject
  → configureProject(project, alias)
      → validateAliasKeys(alias, workspaces)     // NEW, pre-resolution (case 3)
      → createAliasResolver / apply labels
      → validateWorkspaceLabels(workspaces)      // EXISTING, post-resolution (cases 1,2)
```

### Error handling

Plain `Error` from kernel, consistent with the two sibling checks. It propagates out of
project configuration during load and is surfaced like any other config-load failure.

## Testing

Integration (`workspaces-alias.test.ts`, replacing the `it.todo`):

- duplicate alias → error,
- alias equal to an existing workspace ID → error,
- object alias key for a non-existent path → error,
- a fully valid alias config → passes.

Kernel unit test for `validateAliasKeys`: undefined no-op, function no-op, all-valid-keys
no-op, one unknown key throws with the known-paths list.

## Spec

`spec/07-workspace.md` — add the "alias key must match a known workspace path" rule to the
Alias Rules list. CHANGELOG entry + version bump to 4.1.0 (MINOR: materially expanded rule).
