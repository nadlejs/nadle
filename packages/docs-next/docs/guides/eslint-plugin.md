# ESLint Plugin

`eslint-plugin-nadle` provides ESLint rules for `nadle.config.ts` files, catching common configuration mistakes at authoring time.

## Installation

```bash
pnpm add -D eslint-plugin-nadle
```

## Configuration

Add the recommended config to your `eslint.config.ts`:

```typescript
import nadle from "eslint-plugin-nadle";

export default [
	// ... your other configs
	nadle.configs.recommended
];
```

This activates all recommended rules scoped to `nadle.config.*` files.

## Presets

| Preset                      | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| `nadle.configs.recommended` | Errors for correctness rules, warnings for best practices |
| `nadle.configs.all`         | All rules at error level                                  |

## Rules

### Correctness (errors in recommended)

| Rule                            | Description                                                  |
| ------------------------------- | ------------------------------------------------------------ |
| `nadle/no-anonymous-tasks`      | Require string literal names in task registration            |
| `nadle/no-duplicate-task-names` | Prevent duplicate task names in same file                    |
| `nadle/valid-task-name`         | Enforce valid task naming pattern (`lowercase-with-hyphens`) |
| `nadle/valid-depends-on`        | Ensure `dependsOn` values are strings or string arrays       |

### Best Practice (warnings in recommended)

| Rule                             | Description                                         |
| -------------------------------- | --------------------------------------------------- |
| `nadle/require-task-description` | Encourage task descriptions                         |
| `nadle/require-task-inputs`      | Warn when `outputs` declared without `inputs`       |
| `nadle/no-sync-in-task-action`   | Discourage sync APIs in task actions                |
| `nadle/no-process-cwd`           | Use `context.workingDir` instead of `process.cwd()` |

### Style (warning in recommended)

| Rule                          | Fixable | Description                                   |
| ----------------------------- | ------- | --------------------------------------------- |
| `nadle/padding-between-tasks` | Yes     | Enforce empty line between task registrations |

### Opt-in (only in `all` preset)

| Rule                             | Description                                 |
| -------------------------------- | ------------------------------------------- |
| `nadle/no-circular-dependencies` | Detect circular task dependency chains      |
| `nadle/prefer-builtin-task`      | Suggest built-in task types when applicable |

## Custom Configuration

Override individual rules after spreading a preset:

```typescript
import nadle from "eslint-plugin-nadle";

export default [
	nadle.configs.recommended,
	{
		files: ["**/nadle.config.*"],
		rules: {
			"nadle/no-circular-dependencies": "error",
			"nadle/require-task-description": "off"
		}
	}
];
```
