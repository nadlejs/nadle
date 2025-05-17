# nadle

A Node.js task orchestration library with first-class TypeScript support, providing type-safe build automation and task management.

## Installation

```bash
npm install -D nadle
# or
yarn add -D nadle
# or
pnpm add -D nadle
```

## Features

- First-class TypeScript support with full type inference
- Modern ESM package
- Lightweight and efficient
- Task dependency management
- Parallel task execution
- Progress tracking
- Configurable logging levels

## Usage

### Basic CLI Usage

The nadle CLI can be run with the following format:

```bash
nadle [options] [tasks...]
```

Common options:

- `--config <file>` - Path to the configuration file (optional, defaults to `build.nadle.ts` in current directory)
- `--show-summary` - Display execution summary
- `--log-level` - Set logging level (e.g., info)
- `--max-workers` - Set maximum number of parallel
- `--min-workers` - Set minimum number of parallel workers
- `--list` - List all available tasks
- `-h` - Show help

### Task Configuration

Create a TypeScript configuration file (e.g., `build.nadle.ts`) to define your tasks:

```typescript
import { tasks, type Task } from "nadle";

// Basic task
tasks
	.register("hello", async () => {
		console.log("Hello from nadle!");
	})
	.config({
		group: "Greetings",
		description: "Say hello"
	});

// Task with dependencies
tasks
	.register("goodbye", () => {
		console.log("Goodbye!");
	})
	.config({
		group: "Greetings",
		dependsOn: ["hello"],
		description: "Say goodbye"
	});

// Task with options
const CopyTask: Task<{ to: string; from: string }> = {
	run: ({ options }) => {
		const { to, from } = options;
		console.log(`Copying from ${from} to ${to}`);
	}
};

tasks
	.register("copy", CopyTask, {
		to: "dist/",
		from: "assets/"
	})
	.config({
		dependsOn: ["prepare"]
	});
```

### Task Features

1. **Dependencies**: Tasks can depend on other tasks using `dependsOn`
2. **Grouping**: Tasks can be organized into groups
3. **Type Safety**: Full TypeScript support for task options
4. **Parallel Execution**: Tasks run in parallel when possible
5. **Error Handling**: Built-in error handling and reporting

## Development

This package uses TypeScript and is built with modern tooling.

### Prerequisites

- Node.js (latest LTS recommended)
- pnpm 9.15.1 or higher

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Available Scripts

- `pnpm build` - Builds the package using TypeScript
- `pnpm test` - Runs tests using Vitest
- `pnpm start` - Starts TypeScript in watch mode for development

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
