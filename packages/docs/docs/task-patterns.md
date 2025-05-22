---
sidebar_position: 4
---

# Task Patterns

This guide covers common patterns and best practices when working with Nadle tasks.

## Task Organization

### Grouping Related Tasks

Organize tasks into logical groups:

```typescript
// Build related tasks
tasks
	.register("clean", async () => {
		/* ... */
	})
	.config({ group: "Build" });

tasks
	.register("compile", async () => {
		/* ... */
	})
	.config({ group: "Build" });

// Test related tasks
tasks
	.register("test:unit", async () => {
		/* ... */
	})
	.config({ group: "Test" });

tasks
	.register("test:e2e", async () => {
		/* ... */
	})
	.config({ group: "Test" });
```

### Task Naming Conventions

Follow these naming conventions for clarity:

- Use lowercase names
- Use colons (`:`) to namespace related tasks
- Use hyphens (`-`) for multi-word task names

```typescript
tasks.register("build:web", async () => {
	/* ... */
});
tasks.register("build:mobile", async () => {
	/* ... */
});
tasks.register("test:integration", async () => {
	/* ... */
});
tasks.register("deploy:staging", async () => {
	/* ... */
});
```

## Reusable Task Patterns

### File Operations Task

Create reusable file operation tasks:

```typescript
interface FileOptions {
	source: string;
	destination: string;
	pattern?: string;
}

const CopyTask: Task<FileOptions> = {
	run: async ({ options, logger }) => {
		const { source, destination, pattern } = options;
		logger.info(`Copying from ${source} to ${destination}`);
		// Implementation
	}
};

tasks
	.register("copy:assets", CopyTask, {
		source: "./src/assets",
		destination: "./dist/assets"
	})
	.config({
		group: "Build",
		description: "Copy asset files to distribution"
	});
```

### Watch Task Pattern

Implement file watching tasks:

```typescript
interface WatchOptions {
	paths: string[];
	command: string;
}

const WatchTask: Task<WatchOptions> = {
	run: async ({ options, logger }) => {
		const { paths, command } = options;
		logger.info(`Watching ${paths.join(", ")}`);
		// Implementation
	}
};

tasks
	.register("watch", WatchTask, {
		paths: ["src/**/*.ts"],
		command: "build"
	})
	.config({
		group: "Development",
		description: "Watch for changes and rebuild"
	});
```

## Error Handling Patterns

### Graceful Error Recovery

Implement robust error handling:

```typescript
tasks
	.register("deploy", async ({ logger }) => {
		try {
			// Deployment steps
		} catch (error) {
			logger.error(`Deployment failed: ${error.message}`);
			// Cleanup or rollback steps
			throw error; // Re-throw to indicate task failure
		}
	})
	.config({
		group: "Deploy",
		description: "Deploy with error handling"
	});
```

### Conditional Task Execution

Skip tasks based on conditions:

```typescript
tasks
	.register("optimize", async ({ logger }) => {
		if (process.env.NODE_ENV !== "production") {
			logger.info("Skipping optimization in non-production environment");
			return;
		}
		// Optimization logic
	})
	.config({
		group: "Build",
		description: "Optimize for production"
	});
```

## Performance Patterns

### Parallel Task Execution

Design tasks for parallel execution:

```typescript
tasks
	.register("build:all", async () => {
		// This task's dependencies will run in parallel
	})
	.config({
		dependsOn: ["build:web", "build:mobile", "build:desktop"],
		group: "Build",
		description: "Build all platforms"
	});
```

### Caching Results

Implement result caching for expensive operations:

```typescript
const cache = new Map();

tasks
	.register("expensive-task", async ({ logger }) => {
		const cacheKey = "some-key";

		if (cache.has(cacheKey)) {
			logger.info("Using cached result");
			return cache.get(cacheKey);
		}

		const result = await expensiveOperation();
		cache.set(cacheKey, result);
		return result;
	})
	.config({
		group: "Build",
		description: "Expensive task with caching"
	});
```

## Integration Patterns

### Shell Command Task

Create tasks that run shell commands:

```typescript
interface ShellOptions {
	command: string;
	cwd?: string;
}

const ShellTask: Task<ShellOptions> = {
	run: async ({ options, logger }) => {
		const { command, cwd } = options;
		logger.info(`Running: ${command}`);
		// Implementation using child_process or similar
	}
};

tasks
	.register("lint", ShellTask, {
		command: "eslint .",
		cwd: process.cwd()
	})
	.config({
		group: "Quality",
		description: "Run ESLint"
	});
```

### Composite Tasks

Create tasks that combine multiple operations:

```typescript
tasks
	.register("release", async ({ logger }) => {
		logger.info("Starting release process");
	})
	.config({
		dependsOn: ["test:all", "build:production", "generate:changelog", "bump:version", "publish"],
		group: "Release",
		description: "Complete release process"
	});
```
