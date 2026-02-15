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

1. Look for a `nadle.config.{js,mjs,ts,mts}` file.
2. Detect a monorepo root via package manager tooling (lock files, workspace config).
3. Check for `nadle.root: true` in `package.json`.

The root workspace must have a config file. If no config file is found, Nadle raises
an error with guidance to use `--config`.

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
[07-workspace.md](07-workspace.md)).

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
