# Defining Task

To create reusable and configurable task logic, use the `defineTask` API. This allows you to encapsulate behavior in a type-safe, shareable way that can be used across multiple task registrations.

This is particularly useful for implementing tasks like `CopyTask`, `ExecTask`, or any custom logic that accepts parameters and integrates cleanly with Nadle’s runtime.

---

## Basic Example: Greeting Task

```ts title="tasks/greeting-task.ts"
import { defineTask } from "nadle";

export interface GreetingTaskOptions {
	readonly name: string;
}

export const GreetingTask = defineTask<GreetingTaskOptions>({
	run: async ({ options, context }) => {
		context.logger.info(`Hello, ${options.name}!`);
	}
});
```

- `GreetingTaskOptions` defines the expected options.
- The `run()` function contains the logic to execute.
- `context.logger` is used to output logs during execution.

You can then register this task in your config:

```ts
import { tasks } from "nadle";
import { MyTask } from "./tasks/my-task.js";

tasks.register("printMessage", PnpmTask, {
	args: ["--filter", "nadle", "build"]
});
```

## Using the Task

```ts
import { tasks } from "nadle";
import { GreetingTask } from "./tasks/greeting-task.js";

tasks.register("greetAlice", GreetingTask, { name: "Alice" });
tasks.register("greetBob", GreetingTask, { name: "Bob" });
```

Each task will invoke the same `GreetingTask` logic with its own `name` argument.

## When to Use `defineTask`

Use `defineTask` when:

- You want to organize logic outside the config file.
- The task requires input parameters (like name, path, args, etc.).
- You want strong typing and reusability across tasks.
