# Workspace

A Nadle project and its workspaces are detected using the following resolvation algorithm:

A workspace in Nadle represents a distinct project or package within a monorepo.
It enables modular organization of code, configuration, and tasks, making large codebases easier to manage and automate.

A workspace is typically a directory in the monorepo that contains its own code, configuration,
and optionally a Nadle config file. Each workspace can have its own configuration file (e.g., `nadle.config.js`, `nadle.config.ts`).
Note that, except for the root config file, all sub-workspace configuration files must be placed directly
at the first level inside the workspace directory—next to the package.json.

Nadle follows the same conventions and detection logic as popular package managers like
[npm](https://docs.npmjs.com/about-npm), [pnpm](https://pnpm.io/), and [yarn](https://yarnpkg.com/),
so any workspace recognized by those tools will be recognized by Nadle as well.

Workspaces are automatically detected based on your monorepo tool and project structure.
The root of the repository is also treated as a special workspace, known as the [root workspace](#root-workspace).

:::info

## Workspace Detection Algorithm

1. Starting from the current working directory, Nadle traverses up the directory tree to find a `package.json` file that contains a field named `nadle` with a nested field `root` set to `true`.
   - If found, that folder is treated as the root workspace.
   - Nadle then tries to detect the package manager by looking for its specific files (e.g., `pnpm-workspace.yaml` for pnpm, or a `workspaces` field inside `package.json`).
2. If no such `package.json` is found, Nadle re-traversing up to find a common setup for a supported package manager (npm, pnpm, yarn).
   - If found, Nadle resolves workspaces using the conventions and configuration of the detected package manager.
   - If no package manager is detected, Nadle throws an error indicating that it cannot find a valid workspace setup.

This approach ensures Nadle can work seamlessly with monorepos managed by popular tools, and allows explicit root workspace configuration for advanced setups.

:::

## Identifier

Nadle assigns each workspace an ID based on its relative path from the monorepo root, with slashes replaced by colons.

**Example:** Given the following project structure:

```text
my-monorepo/
├── other
│   └── package.json
├── packages/
│   └── app/
|       └── package.json
└── nadle.config.ts
```

The workspace IDs would be:

- `other` for `other` package
- `packages:app` for `packages/app` package
- The root workspace will always have the ID `root`.
-

## Root Workspace

The root workspace always exists in a Nadle project. Its ID is `root` by default, but you can change its label using the alias option (see [below section](#labels-and-aliases)).

When you run a task at the root level (e.g., `nadle build`), Nadle will:

- Run the root workspace's version of the task first.
- After it finishes, Nadle will also run all tasks with the same name in all sub-workspaces,
  except those that are already scheduled to run before due to the [`dependsOn`](../guides/configuring-task.md#dependson) option.

This ensures that root-level tasks can orchestrate and trigger the same-named tasks across your monorepo, while respecting dependencies.

:::note
The reverse is not true—running a task in a sub-workspace does not automatically trigger the root workspace's version of the task. Only the explicitly referenced workspace's task will run.
:::

## Labels and Aliases

You can assign labels (or aliases) to workspaces in your Nadle config to simplify how they’re displayed or referenced (e.g., using `app` instead of `package:app`).
To define these aliases, use the [`alias`](../api/index/interfaces/NadleFileOptions.md#alias) option in the configure function.

**Example:**

```ts
// nadle.config.ts at root of your monorepo
import { tasks, configure } from "nadle";

configure({
	alias: (workspacePath) => {
		if (workspacePath === "shared/api") {
			return "api";
		}
		// Add more mappings as needed
	}
});
```

With this setup, a task `build` inside `share:api` workspace can be specified as `api:build`.
