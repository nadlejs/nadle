---
description: Explore Nadle features including type-safe tasks, DAG-based parallel execution, input/output caching, monorepo support, and smart CLI.
keywords: [nadle, features, type safety, caching, parallel execution, monorepo]
---

# Features

Nadle comes packed with powerful features to make your build automation and task management more efficient.

## Type Safety

### TypeScript First

- Built from the ground up with TypeScript
- Complete type inference for tasks and configurations
- Compile-time error detection
- IDE support with IntelliSense

### Type-Safe Task Options

```typescript
import { tasks, defineTask } from "nadle";

interface BuildOptions {
	target: "web" | "mobile";
	optimize: boolean;
}

const BuildTask = defineTask<BuildOptions>({
	run: async ({ options }) => {
		const { target, optimize } = options;
		// Type-safe access to options
	}
});

tasks.register("build", BuildTask, {
	target: "web",
	optimize: false
});
```

## Parallel Execution

- Automatic parallel task execution via worker threads
- DAG-based dependency resolution
- Configurable concurrency limits
- Progress tracking for parallel tasks

```typescript
tasks
	.register("build:all", async () => {
		// These tasks will run in parallel if possible
	})
	.config({
		dependsOn: ["build:web", "build:mobile", "build:desktop"]
	});
```

## Dependency Management

- Clear dependency declaration
- Circular dependency detection
- Topological sort scheduling

```typescript
tasks
	.register("deploy", async () => {
		// Deploy implementation
	})
	.config({
		dependsOn: ["build", "test"]
	});
```

## Progress Tracking

### Real-Time Progress

- Task execution status with interactive footer
- Scheduled, running, and completed task indicators
- Time tracking
- Detailed error reporting

### Logging System

- Multiple log levels
- Structured logging
- Color-coded output

```typescript
tasks.register("build", async ({ context }) => {
	context.logger.info("Starting build...");
	context.logger.debug("Debug details...");
	// ... build steps
	context.logger.warn("Something to watch out for");
});
```

Available logger methods: `log`, `info`, `warn`, `error`, `debug`, `throw`.

## Task Organization

### Grouping and Naming

- Logical task groups
- Consistent naming conventions
- Task discovery via `nadle --list`

```typescript
tasks
	.register("build:web", async () => {
		// Implementation
	})
	.config({
		group: "Build",
		description: "Build web application"
	});
```

## Error Handling

### Robust Error Management

- Detailed error messages
- Stack trace preservation

```typescript
tasks.register("deploy", async ({ context }) => {
	try {
		// Deployment steps
	} catch (error) {
		context.logger.error("Deployment failed", { error });
		// Cleanup or rollback steps
	}
});
```

## Caching

### Input Fingerprinting

Nadle caches task results based on declared inputs and outputs. When inputs haven't changed since the last run, the task is skipped and outputs are restored from cache.

- Declare file and directory inputs/outputs
- Cache stored in `.nadle/` directory
- Skip with `--no-cache` flag

```typescript
import { tasks, ExecTask, Inputs, Outputs } from "nadle";

tasks
	.register("compile", ExecTask, {
		command: "tsc",
		args: ["--build"]
	})
	.config({
		inputs: [Inputs.files("src/**/*.ts", "tsconfig.json")],
		outputs: [Outputs.dirs("lib")],
		description: "Compile TypeScript sources"
	});
```

### Cache Declarations

- `Inputs.files(...patterns)` — declare file input patterns
- `Inputs.dirs(...patterns)` — declare directory input patterns
- `Outputs.files(...patterns)` — declare file output patterns
- `Outputs.dirs(...patterns)` — declare directory output patterns

## Environment Variables

Tasks can set environment variables via the `env` config field:

```typescript
tasks
	.register("build:prod", async () => {
		// Build with production env
	})
	.config({
		env: {
			NODE_ENV: "production",
			MINIFY: true
		}
	});
```

## Built-in Tasks

Nadle ships with reusable task types for common operations.

### ExecTask

Run arbitrary shell commands:

```typescript
import { tasks, ExecTask } from "nadle";

tasks.register("lint", ExecTask, {
	command: "eslint",
	args: [".", "--cache"]
});
```

### NodeTask

Run Node.js scripts:

```typescript
import { tasks, NodeTask } from "nadle";

tasks.register("seed", NodeTask, {
	script: "scripts/seed-db.mjs"
});
```

### NpmTask

Run npm commands:

```typescript
import { tasks, NpmTask } from "nadle";

tasks.register("install", NpmTask, {
	args: ["install", "--frozen-lockfile"]
});
```

### NpxTask

Run locally-installed binaries via npx:

```typescript
import { tasks, NpxTask } from "nadle";

tasks.register("lint", NpxTask, {
	command: "eslint",
	args: [".", "--cache"]
});
```

### PnpmTask

Run pnpm commands:

```typescript
import { tasks, PnpmTask } from "nadle";

tasks.register("install", PnpmTask, {
	args: ["install", "--frozen-lockfile"]
});
```

### PnpxTask

Run locally-installed binaries via pnpm exec:

```typescript
import { tasks, PnpxTask } from "nadle";

tasks.register("build", PnpxTask, {
	command: "tsup",
	args: []
});
```

### CopyTask

Copy files with glob patterns:

```typescript
import { tasks, CopyTask } from "nadle";

tasks.register("copy:assets", CopyTask, {
	from: "src/assets",
	to: "dist/assets",
	include: ["**/*.png", "**/*.svg"]
});
```

### DeleteTask

Delete files and directories:

```typescript
import { tasks, DeleteTask } from "nadle";

tasks.register("clean", DeleteTask, {
	paths: ["**/lib/**", "**/build/**"]
});
```

## Next Steps

1. Dive into [Configuration Reference](../config-reference.md)
2. Explore the API Documentation
