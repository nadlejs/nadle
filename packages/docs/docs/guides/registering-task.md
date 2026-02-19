---
description: Register tasks in Nadle using tasks.register — as empty aggregation tasks, inline actions, or reusable defineTask classes.
keywords: [nadle, register task, tasks.register, task registration]
---

# Registering Task

Nadle supports three ways to register tasks using `tasks.register(...)`.

---

## 1. Empty Task

An empty task has no execution logic. It is typically used to define a logical grouping of other tasks or to act as a single entry point in the task graph.

This is useful when creating a high-level task that simply depends on other subtasks.

**Example:**
To create a top-level **build** task that runs multiple subtasks for building different parts of your project, you can define it like this:

```ts
import { tasks } from "nadle";

tasks.register("build").config({
	dependsOn: ["buildFrontend", "buildBackend"]
});
```

## 2. Action Task

An action task includes inline logic that will be executed when the task runs. The task function can be **synchronous** or **asynchronous**.

Use this when the task logic is custom, simple, and doesn't need to be reused across multiple tasks.

```ts
// Synchronous
import fs from "node:fs";

import { tasks } from "nadle";

tasks.register("clean", () => {
	if (fs.existsSync("dist")) {
		fs.rmSync("dist", { recursive: true });
		console.log("Cleaned dist/ directory.");
	} else {
		console.log("dist/ directory does not exist.");
	}
});
```

```ts
// Asynchronous
import { writeFile } from "node:fs/promises";

import { tasks } from "nadle";
import fetch from "node-fetch";

tasks.register("fetchData", async () => {
	const res = await fetch("https://jsonplaceholder.typicode.com/posts");
	const data = await res.json();
	await writeFile("data.json", JSON.stringify(data, null, 2));
	console.log("Fetched and saved data to data.json.");
});
```

These kinds of tasks are ideal for setup steps, scripts, or one-off automation logic defined directly in the configuration file.

## 3. Reusable Task

Reusable tasks are based on predefined implementations—either built-in or custom—that accept options to customize behavior.
This makes it easy to reuse logic across multiple tasks without duplicating code.

```ts
import { tasks, CopyTask } from "nadle";

tasks.register("copy", CopyTask, {
	from: "assets/",
	to: "dist/"
});
```

This pattern is especially useful for standardized operations like copying files, executing shell commands,
or compiling code where the task logic stays the same, but the inputs or targets may vary.
