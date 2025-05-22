---
sidebar_position: 1
---

# API Reference

This section provides detailed documentation for Nadle's API.

## Core Types

### `Task<Options>`

The main task interface that defines the structure of a Nadle task:

```typescript
interface Task<Options = void> {
  run: (context: TaskContext<Options>) => Promise<void> | void;
}

interface TaskContext<Options> {
  options: Options;
  logger: Logger;
}
```

### TaskRegistry

The registry that manages all tasks:

```typescript
interface TaskRegistry {
  register<Options>(
    name: string,
    task: Task<Options>,
    options?: Options
  ): TaskConfiguration;
}
```

### TaskConfiguration

Configuration options for tasks:

```typescript
interface TaskConfiguration {
  config(options: {
    group?: string;
    description?: string;
    dependsOn?: string[];
  }): TaskConfiguration;
}
```

## Core Functions

### tasks

The main entry point for registering tasks:

```typescript
import { tasks } from "nadle";

tasks.register("taskName", async () => {
  // Task implementation
});
```

### Logger

Built-in logging utility:

```typescript
interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}
```

## CLI Options

The Nadle CLI supports the following options:

| Option | Description | Default |
|--------|-------------|---------|
| `--config` | Path to configuration file | `build.nadle.ts` |
| `--log-level` | Logging level (debug, info, warn, error) | `info` |
| `--list` | List available tasks | - |
| `--dry-run` | Show execution plan without running | - |
| `-h, --help` | Show help | - |

## Environment Variables

Nadle respects the following environment variables:

- `NADLE_CONFIG`: Path to configuration file
- `NADLE_LOG_LEVEL`: Default logging level
- `NADLE_NO_COLOR`: Disable colored output

## Error Handling

Tasks can throw errors which will be properly handled by Nadle:

```typescript
tasks
  .register("riskyTask", async () => {
    throw new Error("Something went wrong");
  })
  .config({
    group: "Example",
    description: "A task that might fail"
  });
```

## Advanced Usage

### Custom Task Types

You can create reusable task types:

```typescript
interface BuildOptions {
  target: string;
  mode: "development" | "production";
}

const BuildTask: Task<BuildOptions> = {
  run: async ({ options, logger }) => {
    const { target, mode } = options;
    logger.info(`Building ${target} in ${mode} mode`);
  }
};

tasks
  .register("build", BuildTask, {
    target: "web",
    mode: "production"
  })
  .config({
    group: "Build",
    description: "Build the project"
  });
```

### Task Composition

Tasks can be composed using dependencies:

```typescript
// Define base tasks
tasks.register("lint", async () => {/* ... */});
tasks.register("test", async () => {/* ... */});
tasks.register("build", async () => {/* ... */});

// Compose them into a CI task
tasks
  .register("ci", async () => {
    // Additional CI-specific logic
  })
  .config({
    group: "CI",
    description: "Run CI pipeline",
    dependsOn: ["lint", "test", "build"]
  });
``` 