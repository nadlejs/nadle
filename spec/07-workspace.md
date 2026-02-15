# 07 — Workspace Model

A **workspace** is a directory within the project that can register its own tasks.

## Workspace Fields

| Field            | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| `id`             | Unique identifier derived from the relative path.                      |
| `label`          | Human-readable display label (defaults to the ID).                     |
| `relativePath`   | Path relative to the project root.                                     |
| `absolutePath`   | Absolute filesystem path.                                              |
| `dependencies`   | List of workspace IDs this workspace depends on (from `package.json`). |
| `packageJson`    | Parsed `package.json` contents.                                        |
| `configFilePath` | Path to this workspace's config file, or null if none exists.          |

## Identity

Workspace IDs are derived from the relative path by replacing path separators with
colons:

| Relative Path     | Workspace ID      |
| ----------------- | ----------------- |
| `packages/foo`    | `packages:foo`    |
| `shared/api`      | `shared:api`      |
| `apps/web/client` | `apps:web:client` |
| `.` (root)        | `root`            |

The root workspace always has the ID `"root"` and the relative path `"."`.

Backslashes (Windows paths) are normalized to forward slashes before conversion.

## Config Files

Each workspace may have its own `nadle.config.{js,mjs,ts,mts}` file:

- The root workspace's config file is **required**.
- Child workspace config files are **optional**.
- Workspace config files are loaded after the root config file.
- Config files register tasks scoped to their workspace.

## Workspace Dependencies

Workspace dependencies are populated from the `package.json` dependency fields:

- `dependencies`
- `devDependencies`
- `peerDependencies`
- `optionalDependencies`

If a dependency references another workspace in the project (e.g., via
`workspace:*` protocol), it is recorded as a workspace dependency. These
dependencies are informational and used for workspace ordering — they do not
automatically create task dependencies.

## Aliases

Aliases provide human-readable labels for workspaces. They are configured via the
`configure()` function in the root config file:

- **Object map**: `{ "shared/api": "api" }` — maps workspace paths to labels.
- **Function**: `(workspacePath) => label | undefined` — returns a label or undefined.

### Alias Rules

- Aliases affect **display labels only** — not task identifiers or resolution logic.
- An alias must not be empty for non-root workspaces.
- An alias must not duplicate another workspace's label.
- An alias must not duplicate another workspace's ID.
- The root workspace label defaults to empty string (so its tasks display without
  a prefix).

## Task Scoping

- Tasks are scoped to the workspace whose config file registered them.
- The same task name may exist in different workspaces.
- When resolving a task reference without a workspace prefix, Nadle looks in the
  current workspace first.
- If the task is not found in the current workspace, Nadle falls back to the root
  workspace.
