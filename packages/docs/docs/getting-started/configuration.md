---
sidebar_position: 2
---

# Configuration

## Basic Configuration

1. Create a configuration file named `build.nadle.ts` in your project root:

```typescript
import { tasks } from "nadle";

// Define a simple task
tasks
	.register("hello", async () => {
		console.log("Hello from Nadle!");
	})
	.config({
		group: "Demo",
		description: "A simple hello world task"
	});

// Task with dependencies
tasks
	.register("build", async () => {
		console.log("Building project...");
	})
	.config({
		group: "Build",
		description: "Build the project",
		dependsOn: ["clean"]
	});

// Task with options
tasks
	.register("clean", async () => {
		console.log("Cleaning build directory...");
	})
	.config({
		group: "Build",
		description: "Clean build artifacts"
	});
```

## Task Configuration

### Task Dependencies

Tasks can depend on other tasks using the `dependsOn` option:

```typescript
tasks
	.register("deploy", async () => {
		console.log("Deploying...");
	})
	.config({
		group: "Deploy",
		description: "Deploy the application",
		dependsOn: ["build", "test"]
	});
```

### Task Options

You can create tasks with typed options:

```typescript
import { type Task } from "nadle";

const CopyTask: Task<{ from: string; to: string }> = {
	run: ({ options }) => {
		const { from, to } = options;
		console.log(`Copying from ${from} to ${to}`);
	}
};

tasks
	.register("copy", CopyTask, {
		from: "src/",
		to: "dist/"
	})
	.config({
		group: "Build",
		description: "Copy files from source to destination"
	});
```
