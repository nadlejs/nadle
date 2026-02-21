# Quickstart: ESLint Plugin for Nadle

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

## Available Presets

| Preset                      | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| `nadle.configs.recommended` | Errors for correctness rules, warnings for best practices |
| `nadle.configs.all`         | All rules at error level                                  |

## Rules

| Rule                             | Recommended | Fixable | Description                                          |
| -------------------------------- | ----------- | ------- | ---------------------------------------------------- |
| `nadle/no-anonymous-tasks`       | error       | No      | Require string literal names in task registration    |
| `nadle/no-duplicate-task-names`  | error       | No      | Prevent duplicate task names in same file            |
| `nadle/valid-task-name`          | error       | No      | Enforce valid task naming pattern                    |
| `nadle/valid-depends-on`         | error       | No      | Ensure dependsOn values are strings or string arrays |
| `nadle/no-circular-dependencies` | -           | No      | Detect circular task dependency chains               |
| `nadle/require-task-description` | warn        | No      | Encourage task descriptions                          |
| `nadle/require-task-inputs`      | warn        | No      | Warn when outputs declared without inputs            |
| `nadle/no-sync-in-task-action`   | warn        | No      | Discourage sync APIs in task actions                 |
| `nadle/no-process-cwd`           | warn        | No      | Use context.workingDir instead of process.cwd()      |
| `nadle/padding-between-tasks`    | warn        | Yes     | Enforce empty line between task registrations        |
| `nadle/prefer-builtin-task`      | -           | No      | Suggest built-in task types when applicable          |
