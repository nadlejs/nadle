# 06 — Project Model

A **project** is the top-level container in Nadle. It consists of a root workspace,
zero or more child workspaces, and a detected package manager.

## Project Structure

| Field                | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `rootWorkspace`      | The root workspace (always present, always has a config file).  |
| `workspaces`         | Sorted list of child workspaces.                                |
| `packageManager`     | Detected package manager name (`"pnpm"`, `"npm"`, or `"yarn"`). |
| `currentWorkspaceId` | ID of the workspace where Nadle was invoked (defaults to root). |

## Root Detection

The project root is found by searching upward from the current directory:

1. Look for a `package.json` marked with `nadle.root: true`. If found, that directory is the
   root (and is further inspected for a monorepo layout).
2. Otherwise, detect a monorepo root via package manager tooling (lock files, workspace config).
3. Otherwise, fall back to the closest ancestor directory that contains a `package.json`,
   treated as a single-package project.

If no `package.json` is found in any ancestor directory, Nadle raises an error.

## Package Manager Detection

The package manager is detected automatically from lock files and workspace
configuration — it is not manually configured. Detection uses the `@manypkg/tools`
library.

| Lock File           | Package Manager |
| ------------------- | --------------- |
| `pnpm-lock.yaml`    | pnpm            |
| `package-lock.json` | npm             |
| `yarn.lock`         | yarn            |

## Workspace Discovery

Child workspaces are discovered via the package manager's workspace configuration:

- **pnpm**: `pnpm-workspace.yaml`
- **npm/yarn**: `workspaces` field in root `package.json`

Each discovered package directory becomes a workspace (see
[07-workspace.md](07-workspace.md)), **except the project root itself**: a workspace
pattern that matches the root directory (for example a pattern of `.`) does not create a
second workspace, because the root is already represented by the root workspace. Such a
match is ignored rather than treated as an error.

Workspaces are sorted by their relative path for deterministic ordering.

## Project Resolution Flow

1. Find the project root (config file or monorepo root).
2. Detect the package manager.
3. Discover all workspaces.
4. Create the root workspace with its config file path.
5. Create child workspaces with their package metadata.
6. Resolve workspace dependencies from `package.json`.
7. Apply alias configuration (if any).
8. Validate workspace labels for uniqueness.

## Current Workspace

The current workspace is determined by the directory where Nadle is invoked. It defaults
to the root workspace. The current workspace ID affects which workspace receives
task registrations when loading config files.
