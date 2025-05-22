---
sidebar_position: 3
---

# Advanced Configuration

This guide covers advanced configuration options and features in Nadle.

## Custom Configuration Files

### Multiple Configuration Files

You can split your task configuration across multiple files:

```typescript
// build.nadle.ts
import "./tasks/build.js";
import "./tasks/test.js";
import "./tasks/deploy.js";

// tasks/build.ts
import { tasks } from "nadle";

tasks
	.register("build", async () => {
		/* ... */
	})
	.config({
		group: "Build",
		description: "Build the project"
	});
```

### Environment-Specific Configuration

Create environment-specific task configurations:

```typescript
// config/nadle.base.ts
export const baseConfig = {
	buildDir: "./dist",
	assetsDir: "./assets"
};

// config/nadle.dev.ts
import { baseConfig } from "./nadle.base.js";

export const devConfig = {
	...baseConfig,
	apiUrl: "http://localhost:3000"
};

// config/nadle.prod.ts
import { baseConfig } from "./nadle.base.js";

export const prodConfig = {
	...baseConfig,
	apiUrl: "https://api.example.com"
};

// build.nadle.ts
import { tasks } from "nadle";
import { devConfig } from "./config/nadle.dev.js";
import { prodConfig } from "./config/nadle.prod.js";

const config = process.env.NODE_ENV === "production" ? prodConfig : devConfig;

tasks
	.register("build", async ({ logger }) => {
		logger.info(`Building with config: ${JSON.stringify(config)}`);
	})
	.config({
		group: "Build",
		description: "Build with environment config"
	});
```

## Task Lifecycle Hooks

### Pre and Post Hooks

Implement task lifecycle hooks:

```typescript
tasks
	.register("pre:build", async () => {
		// Pre-build setup
	})
	.config({
		group: "Build",
		description: "Pre-build setup"
	});

tasks
	.register("post:build", async () => {
		// Post-build cleanup
	})
	.config({
		group: "Build",
		description: "Post-build cleanup"
	});

tasks
	.register("build", async () => {
		// Main build process
	})
	.config({
		dependsOn: ["pre:build"],
		group: "Build",
		description: "Main build task"
	});

// The post hook is registered as a reverse dependency
tasks
	.register("post:build", async () => {
		// Post-build tasks
	})
	.config({
		group: "Build",
		description: "Post-build tasks",
		dependsOn: ["build"]
	});
```

## Advanced Task Dependencies

### Optional Dependencies

Configure optional task dependencies:

```typescript
interface OptionalDependency {
	name: string;
	optional: boolean;
}

tasks
	.register("deploy", async () => {
		// Deployment logic
	})
	.config({
		dependsOn: [{ name: "test", optional: true }, "build"],
		group: "Deploy",
		description: "Deploy with optional testing"
	});
```

### Conditional Dependencies

Implement conditional task dependencies:

```typescript
const shouldRunTests = process.env.SKIP_TESTS !== "true";

tasks
	.register("ci", async () => {
		// CI pipeline logic
	})
	.config({
		dependsOn: ["lint", ...(shouldRunTests ? ["test"] : []), "build"],
		group: "CI",
		description: "CI pipeline with conditional testing"
	});
```

## Custom Task Runners

### Custom Execution Strategy

Implement custom task execution strategies:

```typescript
interface CustomRunner {
	run: (task: Task) => Promise<void>;
}

const retryRunner: CustomRunner = {
	async run(task) {
		const maxRetries = 3;
		let attempts = 0;

		while (attempts < maxRetries) {
			try {
				await task.run();
				break;
			} catch (error) {
				attempts++;
				if (attempts === maxRetries) {
					throw error;
				}
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
	}
};

tasks
	.register("flaky-task", async () => {
		// Potentially unstable operation
	})
	.config({
		runner: retryRunner,
		group: "Utility",
		description: "Task with retry logic"
	});
```

## Plugin System

### Creating Plugins

Create reusable Nadle plugins:

```typescript
// plugins/typescript.ts
export function typescriptPlugin(options = {}) {
	return {
		name: "typescript",
		tasks: {
			compile: {
				run: async ({ logger }) => {
					logger.info("Compiling TypeScript");
					// TypeScript compilation logic
				},
				config: {
					group: "Build",
					description: "Compile TypeScript files"
				}
			},
			watch: {
				run: async ({ logger }) => {
					logger.info("Watching TypeScript files");
					// Watch mode implementation
				},
				config: {
					group: "Development",
					description: "Watch TypeScript files"
				}
			}
		}
	};
}

// build.nadle.ts
import { tasks } from "nadle";
import { typescriptPlugin } from "./plugins/typescript.js";

tasks.use(
	typescriptPlugin({
		// Plugin options
	})
);
```

### Plugin Configuration

Configure and compose plugins:

```typescript
// plugins/eslint.ts
export function eslintPlugin(config = {}) {
	return {
		name: "eslint",
		tasks: {
			lint: {
				run: async ({ logger }) => {
					logger.info("Running ESLint");
					// ESLint implementation
				},
				config: {
					group: "Quality",
					description: "Lint code with ESLint"
				}
			}
		}
	};
}

// build.nadle.ts
import { tasks } from "nadle";
import { typescriptPlugin } from "./plugins/typescript.js";
import { eslintPlugin } from "./plugins/eslint.js";

tasks.use(typescriptPlugin()).use(
	eslintPlugin({
		configFile: ".eslintrc.js"
	})
);
```
