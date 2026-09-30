---
description: Run Nadle tasks from the CLI — single tasks, multiple tasks, workspace-scoped execution, dry run, and summary mode.
keywords: [nadle, execute task, CLI, run, dry run, summary]
---

# Executing Task

When executing tasks, Nadle ensures the following rules are enforced:

- Each task is executed **at most once** per run, even if listed multiple times via the CLI or required by multiple tasks.
- Dependencies are **always executed before** their dependents, unless explicitly excluded using options like [`--exclude`](../config-reference.md#--exclude).
- The order of dependencies in dependsOn is **not guaranteed**; Nadle determines the optimal execution order based on the dependency graph and may adjust it at any time.

## Running a Single Task

To run a task, use the Nadle CLI from your terminal:

```sh
nadle build
```

This command runs the `build` task in the current workspace.
If the task is not found and the current workspace is not the [root](../concepts/workspace.md#root-workspace), Nadle will fall back to the root workspace.

## Running Multiple Tasks

You can run multiple tasks in a single Nadle command by listing them:

```sh
nadle check build test
```

By default, Nadle will run these tasks sequentially, one after another, in the order specified. This ensures that each task completes before the next begins.

To run multiple tasks in parallel, add the [`--parallel`](../config-reference.md#parallel) flag:

```sh
nadle eslint prettier spell-check --parallel
```

With `--parallel`, Nadle will run the `eslint`, `prettier`, and `spell-check` tasks at the same time,
as long as there are no dependencies between them. If any of these tasks declare dependencies,
Nadle will still ensure the dependencies are completed before running the dependent task, even in parallel mode.

## Running Tasks by Glob Pattern

Instead of listing task names individually, you can select them with a glob pattern. Any task
argument that contains a glob character (`*`, `?`, `[`, `]`, `{`, `}`, `!`) is matched against the
registered task names:

```sh
nadle "build*"
```

This runs every task whose name starts with `build` (e.g. `build`, `build-css`, `build-js`). Quote
the pattern so your shell does not expand it first.

Patterns also work with a workspace qualifier and with [`--exclude`](../config-reference.md#--exclude):

```sh
nadle "api:build*"          # only matching tasks in the api workspace
nadle "build*" --exclude "build-*-dev"
```

If a pattern matches no task, Nadle exits with an error rather than running nothing.

## Running Task with Dependencies

If a task declares dependencies using the [`dependsOn`](./configuring-task.md#dependson) option,
Nadle will automatically execute all dependencies before running the dependent task.
Each dependency is only run once per execution, even if multiple tasks depend on it.

Example:

```ts
tasks.register("build", {
	dependsOn: ["lint", "test"]
});
```

Running `nadle build` will execute `lint` and `test` first, then `build`.

## Running Tasks in Specific Workspace

You can run a task in a specific workspace by prefixing the workspace [ID](../concepts/workspace.md#identifier)
or [label](../concepts/workspace.md#labels-and-aliases), regardless of where the command is executed:

```sh
nadle packages:app:build
nadle api:lint
```

## Running Root Workspace Tasks

When you run a [root-scoped](../concepts/task.md#scope) task (e.g., `nadle root:build` or just `nadle build` from the root), Nadle will:

- Run the [root workspace](../concepts/workspace.md#root-workspace)'s version of the task first.
- Then run all tasks with the same name in other workspaces, except those already scheduled due to [dependencies](../concepts/task.md#dependency-and-dependent).

This allows you to orchestrate and trigger the same-named tasks across your monorepo.

:::note
Running a task in a sub-workspace does not automatically trigger the root workspace's version of the task. Only the explicitly referenced workspace's task will run.
:::

See [Task](../concepts/task.md) and [Workspace](../concepts/workspace.md) for more details on task and workspace concepts.

## Excluding Tasks

You can skip specific tasks during execution using the [`--exclude`](../config-reference.md#--exclude) option.
This is useful when you want to run a group of tasks but intentionally leave out certain ones, even if they are listed as dependencies or in the CLI.

Example:

```sh
nadle build test --exclude lint
```

In this example, Nadle will run the `build` and `test` tasks, but will skip the `lint` task—even if `lint` is a dependency of `build` or `test`. Any excluded task will not be executed for the current run.

You can exclude multiple tasks by repeating the flag or providing a comma-separated list:

```sh
nadle build --exclude lint,spell-check
```

## Passing Extra Arguments to Tasks

Arguments after a bare `--` are passed through to the tasks you request, instead of being parsed
as Nadle options:

```sh
nadle test -- -u
```

Here the `test` task's underlying command receives `-u` appended after its configured arguments.
This works for all exec-based built-in tasks (`ExecTask`, `PnpmTask`, `PnpxTask`, `NpmTask`,
`NpxTask`, `NodeTask`). `CopyTask` and `DeleteTask` ignore passthrough arguments.

Only tasks named on the command line (including glob matches) receive the arguments — their
dependencies do not:

```sh
nadle build -- --sourcemap     # build gets --sourcemap; its dependencies do not
nadle "test:*" -- --reporter dot
```

When several requested tasks receive the same arguments, Nadle logs a notice listing them.

Custom tasks can read the arguments from the runner context:

```ts
tasks.register("greet", ({ context }) => {
	console.log(context.passthroughArgs);
});
```

Passthrough arguments are part of the cache key: a run with arguments is never served from a
cache entry produced without them (dependencies stay cached as usual).

## Task and Workspace Name Autocorrect

Nadle automatically suggests and corrects task and workspace names if you mistype or use a partial name.

For example:

```sh
nadle backe:biuld
# Nadle will resolve to 'backend:build'
```

For more details and examples, see [Auto-correction](../getting-started/features/auto-correction.md).
