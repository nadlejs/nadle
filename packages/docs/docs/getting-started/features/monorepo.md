# Monorepo Support

Nadle is designed for seamless monorepo management, making it easy to automate tasks across multiple packages and workspaces in a single repository.

## Monorepo Detection

Nadle automatically detects monorepo setups managed by [pnpm](https://pnpm.io/), [npm](https://docs.npmjs.com/about-npm), or [yarn](https://yarnpkg.com/).
It identifies all workspaces using your package manager's configuration files (e.g., `pnpm-workspace.yaml`, `package.json` with `workspaces`, etc.).

See [Workspace Detection Algorithm](../../concepts/workspace.md#workspace-detection-algorithm) for details on how Nadle finds and resolves workspaces.

## Workspace Concepts

Each workspace is treated as a distinct unit, with its own configuration and tasks. Learn more in [Workspace](../../concepts/workspace.md).

- Workspaces are discovered and assigned unique IDs (see [Workspace ID](../../concepts/workspace.md#identifier)).
- You can configure [aliases](../../concepts/workspace.md#labels-and-aliases) for easier referencing.
- The [root workspace](../../concepts/workspace.md#root-workspace) is always present and orchestrates tasks across the monorepo.

## Running and Resolving Tasks

Nadle provides flexible ways to run and resolve tasks:

- Reference tasks by workspace [ID](../../concepts/workspace.md#identifier), relative path, or [alias](../../concepts/workspace.md#labels-and-aliases).
- Use the format `<workspace>:<task>` to run a task in a specific workspace (see [Task Identifier](../../concepts/task.md#identifier)).
- If a task is not found in the current workspace, Nadle falls back to the root workspace (see [Task Resolution](../../concepts/task.md#rules)).

See [Executing Task](../../guides/executing-task.md) for CLI usage and orchestration details.

## Aliasing Workspaces

Define aliases in your Nadle config to simplify workspace references. See [Labels and Aliases](../../concepts/workspace.md#labels-and-aliases) for configuration examples and usage.

## Example Usage

```sh
# Run a task in all workspaces
nadle build

# Run a task in a specific workspace
nadle workspace-a:deploy

# Exclude a task in a workspace
nadle build --exclude workspace-b:build

# Run multiple tasks in parallel
nadle eslint prettier spell-check --parallel
```

Automatic workspace detection, flexible configuration, powerful task resolution, and orchestration features are documented in the [concepts](../../concepts/workspace.md) and [guides](../../guides/executing-task.md) sections for further reference.
