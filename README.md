# nadle

A modern, type-safe task runner for Node.js inspired by the awesome Gradle build tool,
supporting parallel execution and streamlined build automation.

## Installation

```bash
npm install -D nadle @nadle/cli
# or
yarn add -D nadle @nadle/cli
# or
pnpm add -D nadle @nadle/cli
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
- `--log-level` - Set logging level (e.g., info)
- `--list` - List all available tasks
- `--dry-run` - Print tasks order without executing them
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

This repositories use Nadle itself for development. Tasks are defined in the `build.nadle.ts` file.

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

- `nadle build` - Builds the package using TypeScript
- `nadle test` - Runs tests using Vitest
- `pnpm start` - Starts TypeScript in watch mode for development

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
