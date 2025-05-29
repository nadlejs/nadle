# Configuration Reference

Nadle provides flexible configuration options through both CLI flags and the build configuration file.
This reference guide covers the available configuration options and how to use them effectively.

## Configuration File

By default, Nadle will look in the **current working directory** for a configuration file in the following order:

- `nadle.config.js`
- `nadle.config.mjs`
- `nadle.config.ts`
- `nadle.config.mts`

You can also specify a custom configuration file location using the `--config` CLI option.

## CLI Options

### `--config <path>`

- **Type:** `string`
- **Alias:** `-c`
- **Default:** Searches for `nadle.config.{js,mjs,ts,mts}` in the current working directory

Specifies a custom path to the configuration file.
This allows using different configurations for different environments or purposes.
The path can be either absolute or relative to the current working directory.
Use this flag to override the default resolution behavior and point to a specific configuration file as needed.

```bash
nadle --config ./configs/nadle.config.ts
```

### `--list`

- **Type:** `boolean`
- **Alias:** `-l`
- **Default:** `false`

List all available tasks in the current project without executing them. This is useful for seeing what tasks are available to run.

### `--dry-run`

- **Type:** `boolean`
- **Default:** `false`

Simulate task execution without actually running the tasks. Shows what would be executed in what order.

```bash
nadle --dry-run build
```

### `--show-config`

- **Type:** `boolean`
- **Default:** `false`

Display the resolved configuration that will be used for task execution. Useful for debugging configuration issues.

```bash
nadle --show-config
```

### `--help`

- **Type:** `boolean`
- **Alias:** `-h`
- **Default:** `false`

Display help information about Nadle CLI usage and available commands.

```bash
nadle --help
```

### `--version`

- **Type:** `boolean`
- **Alias:** `-v`
- **Default:** `false`

Display the current version of Nadle.

## Common Configuration Options

These options can be configured both via CLI flags and in the configuration file.
When both are specified, CLI flags take precedence, allowing quick overrides without modifying the config file.

### `logLevel`

- **Type:** `'error' | 'warn' | 'info' | 'debug'`
- **Default:** `'log'`
- **CLI:** `--log-level <level>`

Set the logging verbosity level. Higher levels include all lower level logs.

### `showSummary`

- **Type:** `boolean`
- **Default:** `!isCI`
- **CLI:** `--show-summary`

Displays real-time progress information during task execution.
Includes the number of scheduled tasks, running tasks, finished tasks, and other execution stats.
Useful for tracking task flow in complex or long-running builds.
Defaults to `true` unless running in a CI environment.

### `maxWorkers`

- **Type:** `number | string`
- **Default:** `100% of CPUs - 1` (at least `1`)
- **CLI:** `--max-workers <number|string>`

Sets the **maximum number of worker threads** Nadle can use.
If unset, it defaults to the total number of cores minus one, ensuring at least one worker is always available.

You can provide:

- An exact number of workers (e.g., `4`)
- A percentage string (e.g., `75%`), which will be calculated based on the number of available CPU cores.

For instance: `75%` on a 16-core machine results in a maximum of 12 workers.

### `minWorkers`

- **Type:** `number | string`
- **Default:** `1`
- **CLI:** `--min-workers <number>`

Specifies the **minimum number of worker threads** used for parallel task execution.
The final value will not exceed the resolved `maxWorkers`.

You can pass:

- An absolute number (e.g., `2`)
- A percentage string (e.g., `50%`), which will be interpreted as a percentage of the available CPU cores.

For example, on an 8-core machine, `50%` means at least 4 workers will be used.

## Configuration File Example

Here's a complete example of a Nadle configuration file:

```typescript
// nadle.config.ts
import { configure } from "nadle";

configure({
	logLevel: "info",
	minWorkers: 2,
	maxWorkers: 4,
	showSummary: false
});
```
