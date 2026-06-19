---
description: Migrate a Makefile to Nadle — targets to tasks, prerequisites to dependsOn, before/after example, and a ready-to-use agent prompt.
keywords: [nadle, migration, makefile, make, targets, prerequisites, migrate]
---

# Migrating from Make

A `Makefile` is a set of **targets**, each with **prerequisites** and a recipe of shell
commands. Nadle keeps that mental model — a task with `dependsOn` and a body — but the recipes
are TypeScript-typed tasks with caching and cross-platform execution instead of tab-indented
shell.

## How concepts map

| Makefile                               | Nadle                                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| target (`build:`)                      | `tasks.register("build", { … })`                                                                         |
| recipe line (a shell command)          | `run: ExecTask` with `command`/`args`                                                                    |
| prerequisites (`build: clean compile`) | `dependsOn: ["clean", "compile"]`                                                                        |
| phony target (`.PHONY: clean`)         | a normal task — every Nadle task is "phony" by default                                                   |
| `make build`                           | `nadle build`                                                                                            |
| file targets / timestamp checks        | declared [`inputs`](../configuring-task.md) / [`outputs`](../configuring-task.md) (real content caching) |
| variables (`CC = gcc`)                 | plain TypeScript `const`s in the config                                                                  |

Make decides whether to rebuild by comparing file timestamps. Nadle does better: declare
`inputs`/`outputs` and it fingerprints content, so a touched-but-unchanged file does not force
a rebuild.

## Before / after

`Makefile`:

```makefile
.PHONY: clean build test check

clean:
	rm -rf dist

build: clean
	tsc

test: build
	vitest run

check: build test
```

`nadle.config.ts`:

```ts
import { tasks, ExecTask, DeleteTask, Inputs, Outputs } from "nadle";

tasks.register("clean", { run: DeleteTask, options: { paths: ["dist"] } });

tasks.register("build", {
	run: ExecTask,
	options: { command: "tsc" },
	dependsOn: ["clean"],
	inputs: [Inputs.dirs("src")],
	outputs: [Outputs.dirs("dist")]
});

tasks.register("test", {
	run: ExecTask,
	options: { command: "vitest", args: ["run"] },
	dependsOn: ["build"]
});

tasks.register("check", { dependsOn: ["build", "test"] });
```

`nadle check` replaces `make check`, and the `clean` recipe maps to the built-in
[`DeleteTask`](../file-operation-tasks.md#deletetask) so it works on every platform.

## Migrate with an agent

Paste this prompt into your coding agent with the `Makefile` open:

```text
Convert my Makefile to a nadle.config.ts at the project root.

For each target:
- Create tasks.register(name, { run: ExecTask, options: { command, args }, dependsOn }).
- Split each recipe command into command (first token) + args (rest, as an array).
- Map prerequisites to dependsOn arrays.
- A target with multiple recipe lines: ask me whether to make each line its own task (preferred)
  or keep them as one task with a custom run function.
- Replace shell file-ops with built-ins where obvious: `rm -rf` -> DeleteTask, `cp` -> CopyTask.
- Resolve Makefile variables to plain TypeScript consts.
- Ignore .PHONY (every Nadle task is phony).

Import only what you use from "nadle". Show me the resulting nadle.config.ts.
```
