---
description: Understand the Nadle task model — naming rules, scopes, identifiers, and how tasks form the core unit of work in your build pipeline.
keywords: [nadle, task, task model, naming, scope, build pipeline]
---

# Task

A **task** in Nadle is a named unit of work for automation, scripting, or orchestration.
Tasks are defined in Nadle configuration files (`nadle.config.js`, `nadle.config.ts`, etc.) at the root or workspace level.

## Name

Each task must have a unique name within its [workspace](./workspace.md).
Task names must start with a letter, may include letters, numbers, and dashes, and must not end with a dash.
If you attempt to register a task with a name that already exists in the same workspace, Nadle will throw an error to prevent duplicates.

**Example:**
This example registers a `build` task in the current workspace.

```ts
import { tasks } from "nadle";

tasks.register("build", () => {
	// Build something
});
```

## Scope

The scope of a task is the [workspace](./workspace.md) where it is registered.
Tasks with the same name in different workspaces are treated as distinct and scoped to their respective workspace.

## Identifier

Since two or more workspaces can have the same task name, use the [workspace ID](./workspace.md#identifier)
or [label](./workspace.md#labels-and-aliases) as a prefix to refer to a task in a specific workspace.

For example, if you have a task named `build` in the workspace `packages:app`, you can refer to it explicitly as `packages:app:build`.

## Dependency and Dependent

A task can declare other tasks as dependencies using the [`dependsOn`](../guides/configuring-task.md#dependson) option.
The tasks listed in `dependsOn` are called **dependencies**, and the task that declares them is called the **dependent**. Nadle ensures that all dependencies are executed before the dependent task runs.

For example, in the following configuration:

```ts
tasks.register("build").config({
	dependsOn: ["lint", "test"]
});
```

Here, `lint` and `test` are dependencies of the `build` task, and `build` is the dependent. When you run `nadle build`, Nadle will execute `lint` and `test` first, then run `build`.

## Rules

Nadle tasks adhere to the following rules:

- Each task is executed **at most once** per run, even if listed multiple times via the CLI or required by multiple tasks.
- Dependencies are **always executed before** their dependents, unless explicitly excluded using options like [`--exclude`](../config-reference.md#--exclude).
- The order of dependencies in dependsOn is **not guaranteed**; Nadle determines execution order from the dependency graph.

See [Defining Task](../guides/defining-task.md) and [Registering Task](../guides/registering-task.md) for details on how to define and register tasks in Nadle.
