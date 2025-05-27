---
sidebar_label: API Reference
---

# configure

The `configure` function is used to set up global configuration for your Nadle build. This reference covers all available options and their usage.

## Basic Usage

```typescript
import { configure } from "nadle";

configure({
	projectName: "my-project",
	workspaceRoot: process.cwd(),
	logLevel: "info"
});
```

## Configuration Options

### Core Options

#### `projectName`

- Type: `string`
- Default: Package name from `package.json`
- Description: The name of your project

```typescript
configure({
	projectName: "my-awesome-project"
});
```

#### `workspaceRoot`

- Type: `string`
- Default: `process.cwd()`
- Description: The root directory of your project

```typescript
configure({
	workspaceRoot: "/path/to/project"
});
```

#### `logLevel`

- Type: `'error' | 'warn' | 'info' | 'debug'`
- Default: `'info'`
- Description: The default logging level

```typescript
configure({
	logLevel: "debug"
});
```

### Execution Options

#### `parallel`

- Type: `boolean | number`
- Default: `true`
- Description: Enable parallel task execution or set max parallel tasks

```typescript
configure({
	parallel: 4 // Run up to 4 tasks in parallel
});
```

#### `plugins`

- Type: `Plugin[]`
- Default: `[]`
- Description: List of Nadle plugins to use

```typescript
import { TypeScriptPlugin } from "@nadle/typescript";

configure({
	plugins: [
		new TypeScriptPlugin({
			tsconfig: "tsconfig.json"
		})
	]
});
```

### Environment Options

#### `environment`

- Type: `Record<string, string>`
- Default: `{}`
- Description: Global environment variables

```typescript
configure({
	environment: {
		NODE_ENV: "development",
		API_URL: "http://localhost:3000"
	}
});
```

#### `environmentFiles`

- Type: `string[]`
- Default: `['.env', '.env.local']`
- Description: List of environment files to load

```typescript
configure({
	environmentFiles: [".env", ".env.local", ".env.${env}"]
});
```

### Advanced Options

#### `hooks`

- Type: `BuildHooks`
- Description: Build lifecycle hooks

```typescript
configure({
	hooks: {
		beforeTask: async (taskName) => {
			console.log(`Starting task: ${taskName}`);
		},
		afterTask: async (taskName, success) => {
			console.log(`Task ${taskName} finished: ${success}`);
		}
	}
});
```

#### `cache`

- Type: `CacheOptions`
- Description: Task caching configuration

```typescript
configure({
	cache: {
		enabled: true,
		directory: ".nadle-cache"
	}
});
```

## Type Definitions

### `ConfigureOptions`

```typescript
interface ConfigureOptions {
	projectName?: string;
	workspaceRoot?: string;
	logLevel?: LogLevel;
	parallel?: boolean | number;
	plugins?: Plugin[];
	environment?: Record<string, string>;
	environmentFiles?: string[];
	hooks?: BuildHooks;
	cache?: CacheOptions;
}
```

### `LogLevel`

```typescript
type LogLevel = "error" | "warn" | "info" | "debug";
```

### `BuildHooks`

```typescript
interface BuildHooks {
	beforeTask?: (taskName: string) => Promise<void>;
	afterTask?: (taskName: string, success: boolean) => Promise<void>;
	beforeBuild?: () => Promise<void>;
	afterBuild?: (success: boolean) => Promise<void>;
}
```

### `CacheOptions`

```typescript
interface CacheOptions {
	enabled?: boolean;
	directory?: string;
	ttl?: number;
}
```

## Examples

### Basic Configuration

```typescript
configure({
	projectName: "my-project",
	logLevel: "info",
	parallel: true
});
```

### With Plugins and Environment

```typescript
import { TypeScriptPlugin } from "@nadle/typescript";
import { DockerPlugin } from "@nadle/docker";

configure({
	projectName: "my-project",
	plugins: [new TypeScriptPlugin(), new DockerPlugin()],
	environment: {
		NODE_ENV: "development"
	}
});
```

### With Hooks

```typescript
configure({
	hooks: {
		beforeTask: async (taskName) => {
			console.log(`Starting: ${taskName}`);
		},
		afterTask: async (taskName, success) => {
			console.log(`Finished ${taskName}: ${success}`);
		},
		beforeBuild: async () => {
			console.log("Build starting");
		},
		afterBuild: async (success) => {
			console.log(`Build finished: ${success}`);
		}
	}
});
```

### With Caching

```typescript
configure({
	cache: {
		enabled: true,
		directory: ".nadle-cache",
		ttl: 3600 // 1 hour
	}
});
```

# tasks.register

The `tasks.register` function is used to define tasks in your Nadle build. This reference covers all aspects of task registration and configuration.

## Basic Usage

```typescript
import { tasks } from "nadle";

tasks
	.register("taskName", async ({ logger }) => {
		logger.info("Task running...");
	})
	.config({
		description: "Task description"
	});
```

## Task Registration

### Simple Task

```typescript
tasks.register("build", async () => {
	// Task implementation
});
```

### Task with Context

```typescript
tasks.register("build", async ({ logger, options, env }) => {
	logger.info("Building...");
	const nodeEnv = env.NODE_ENV;
	// Implementation
});
```

### Task with Options

```typescript
interface BuildOptions {
	target: "web" | "mobile";
	optimize: boolean;
}

tasks
	.register("build", async ({ options }) => {
		const { target, optimize } = options;
		// Implementation
	})
	.config<BuildOptions>({
		defaultOptions: {
			target: "web",
			optimize: false
		}
	});
```

## Task Context

### Available Properties

| Property    | Type                     | Description           |
| ----------- | ------------------------ | --------------------- |
| `logger`    | `Logger`                 | Task logger           |
| `options`   | `T`                      | Task options          |
| `env`       | `Record<string, string>` | Environment variables |
| `workspace` | `Workspace`              | Workspace utilities   |
| `run`       | `TaskRunner`             | Task runner           |

### Logger

```typescript
tasks.register("build", async ({ logger }) => {
	logger.debug("Debug message");
	logger.info("Info message");
	logger.warn("Warning message");
	logger.error("Error message");
	logger.success("Success message");
	logger.progress(0.5, "Half way there");
});
```

### Options

```typescript
interface DeployOptions {
	environment: "staging" | "production";
	region?: string;
}

tasks
	.register("deploy", async ({ options }) => {
		const { environment, region = "us-east-1" } = options;
		// Implementation
	})
	.config<DeployOptions>({
		defaultOptions: {
			environment: "staging"
		}
	});
```

### Environment Variables

```typescript
tasks.register("build", async ({ env }) => {
	const nodeEnv = env.NODE_ENV;
	const apiUrl = env.API_URL;
	// Implementation
});
```

### Workspace Utilities

```typescript
tasks.register("build", async ({ workspace }) => {
	const srcDir = workspace.resolve("src");
	const exists = await workspace.exists("package.json");
	const files = await workspace.glob("src/**/*.ts");
	// Implementation
});
```

### Task Runner

```typescript
tasks.register("build:all", async ({ run }) => {
	// Run tasks in sequence
	await run("clean");
	await run("compile");

	// Run tasks in parallel
	await Promise.all([run("test"), run("lint")]);
});
```

## Task Configuration

### Configuration Options

| Option              | Type                     | Description               |
| ------------------- | ------------------------ | ------------------------- |
| `description`       | `string`                 | Task description          |
| `group`             | `string`                 | Task group                |
| `dependsOn`         | `string[]`               | Required dependencies     |
| `optionalDependsOn` | `string[]`               | Optional dependencies     |
| `environment`       | `Record<string, string>` | Task environment          |
| `parallel`          | `boolean`                | Enable parallel execution |
| `defaultOptions`    | `T`                      | Default task options      |

### Basic Configuration

```typescript
tasks
	.register("build", async () => {
		// Implementation
	})
	.config({
		description: "Build the project",
		group: "Build",
		dependsOn: ["clean"]
	});
```

### Dependencies

```typescript
tasks
	.register("deploy", async () => {
		// Implementation
	})
	.config({
		dependsOn: ["build", "test"], // Required
		optionalDependsOn: ["lint"] // Optional
	});
```

### Environment Variables

```typescript
tasks
	.register("deploy", async () => {
		// Implementation
	})
	.config({
		environment: {
			NODE_ENV: "production",
			DEPLOY_TARGET: "staging"
		}
	});
```

## Special Task Types

### Watch Tasks

```typescript
tasks.register("watch", async () => {
	return {
		paths: ["src/**/*.ts"],
		ignore: ["**/*.test.ts"],
		onChange: async (changes) => {
			await tasks.run("build");
		}
	};
});
```

### Custom Task Types

```typescript
interface CopyTaskOptions {
	source: string;
	destination: string;
}

const CopyTask = {
	run: async ({ options, logger }) => {
		const { source, destination } = options;
		logger.info(`Copying ${source} to ${destination}`);
		// Implementation
	}
};

tasks.register("copy", CopyTask).config<CopyTaskOptions>({
	defaultOptions: {
		source: "src",
		destination: "dist"
	}
});
```

## Type Definitions

### `TaskContext`

```typescript
interface TaskContext<T = any> {
	logger: Logger;
	options: T;
	env: Record<string, string>;
	workspace: Workspace;
	run: TaskRunner;
}
```

### `TaskConfig`

```typescript
interface TaskConfig<T = any> {
	description?: string;
	group?: string;
	dependsOn?: string[];
	optionalDependsOn?: string[];
	environment?: Record<string, string>;
	parallel?: boolean;
	defaultOptions?: T;
}
```

### `WatchOptions`

```typescript
interface WatchOptions {
	paths: string[];
	ignore?: string[];
	onChange: (changes: string[]) => Promise<void>;
}
```

## Examples

### Complete Task Example

```typescript
interface BuildOptions {
	target: "web" | "mobile";
	optimize: boolean;
	outDir?: string;
}

tasks
	.register("build", async ({ logger, options, env, workspace, run }) => {
		const { target, optimize, outDir = "dist" } = options;
		const nodeEnv = env.NODE_ENV;

		logger.info(`Building ${target} for ${nodeEnv}`);

		// Clean first
		await run("clean");

		// Build implementation
		logger.progress(0.5, "Compiling...");

		if (optimize) {
			logger.info("Optimizing build...");
		}

		const outputPath = workspace.resolve(outDir);
		// More implementation...

		logger.success("Build complete");
	})
	.config<BuildOptions>({
		description: "Build the project",
		group: "Build",
		dependsOn: ["clean"],
		environment: {
			NODE_ENV: "production"
		},
		defaultOptions: {
			target: "web",
			optimize: false
		}
	});
```
