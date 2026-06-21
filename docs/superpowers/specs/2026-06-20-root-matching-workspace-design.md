# Drop root-matching workspace (#699)

## Problem

When the workspace glob in `pnpm-workspace.yaml` (or the `workspaces` field) matches the
**project root directory itself** — e.g. `packages: ["."]`, or a broad `./**` that
re-includes the root — `@manypkg` returns the root as one of `packages.packages`.
`createProject` (project-discovery.ts) then maps it to a sub-workspace with an empty
`relativeDir`, producing a workspace with an empty id and empty relativePath that duplicates
the root workspace.

That degenerate workspace later fails label validation with a confusing message:

```
Workspace "root" has label "" which conflicts with the ID of workspace "".
```

This is the "single workspace in monorepo currently errors during detection" case behind the
`it.todo` in `workspaces-detection.test.ts`. (A genuine single *sub-package* monorepo — root
plus one `packages/foo` — already works.)

## Decision

Treat a root-matching workspace pattern as **valid**: drop the root match, since the root is
already its own workspace. The user's config "just works" instead of erroring.

## Design

### Change

In `createProject` (`packages/project-resolver/src/project-discovery.ts`), filter
`packages.packages` to exclude any package whose absolute `dir` equals `packages.rootDir`
before mapping to workspaces:

```ts
workspaces: packages.packages
    .filter((pkg) => pkg.dir !== packages.rootDir)
    .map((pkg) => createWorkspace(pkg))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
```

`pkg.dir` and `packages.rootDir` are both absolute paths from `@manypkg`; equality is the
precise "this discovered package is the root" condition, robust regardless of how the
relative path stringifies (`""` vs `"."`).

### Scope

One `.filter` in one function. No new files, no public-API change. `createWorkspace`,
`createRootWorkspace`, and the alias/label validation are untouched — the degenerate
workspace simply never gets created, so the downstream label-collision error no longer
fires.

### Behavior after

- `packages: ["."]` plus real sub-packages → project resolves to root + the real
  sub-packages, no empty workspace, exit 0.
- A pattern matching only the root → project resolves to root with zero sub-workspaces.
- Genuine sub-package monorepos are unaffected (their package dirs never equal rootDir).

### Error handling

None added — the case is now valid rather than an error.

## Testing

Implement the deferred `it.todo("single workspace in monorepo")` in
`workspaces-detection.test.ts`: a fixture with `pnpm-workspace.yaml` matching `.` plus a
real sub-package, asserting the project resolves cleanly (root + the real sub, no empty
workspace) via `--show-config --config-key project` / `--list-workspaces`. Optionally a
project-resolver-level assertion that no workspace has an empty relativePath.

## Spec

`spec/06-project.md` — Workspace Discovery gains the root-exclusion rule. CHANGELOG entry +
version bump to 4.1.1 (PATCH: corrects detection behavior; #698's 4.1.0 already merged).
