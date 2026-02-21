# Plugin API Contract

## Exports

The plugin exports a single default object:

```typescript
interface NadleEslintPlugin {
	meta: {
		name: "eslint-plugin-nadle";
		version: string;
	};
	rules: Record<string, TSESLint.RuleModule<string, unknown[]>>;
	configs: {
		recommended: TSESLint.FlatConfig.Config;
		all: TSESLint.FlatConfig.Config;
	};
}
```

## Config Preset Shape

Each config preset follows this structure:

```typescript
{
  files: ["**/nadle.config.*"],
  plugins: { nadle: plugin },
  rules: {
    "nadle/rule-name": "error" | "warn"
  }
}
```

## Rule Module Shape

Each rule follows the standard ESLint rule module contract:

```typescript
{
  meta: {
    type: "problem" | "suggestion" | "layout",
    docs: {
      description: string,
      recommended: "error" | "warn" | false
    },
    messages: Record<string, string>,
    fixable?: "code" | "whitespace",
    schema: []
  },
  defaultOptions: [],
  create(context: RuleContext): RuleListener
}
```

## Rule Inventory

| Rule ID                    | Type       | Fixable    | Recommended |
| -------------------------- | ---------- | ---------- | ----------- |
| `no-anonymous-tasks`       | problem    | -          | error       |
| `no-duplicate-task-names`  | problem    | -          | error       |
| `no-circular-dependencies` | problem    | -          | false       |
| `valid-task-name`          | problem    | -          | error       |
| `valid-depends-on`         | problem    | -          | error       |
| `require-task-description` | suggestion | -          | warn        |
| `require-task-inputs`      | suggestion | -          | warn        |
| `no-sync-in-task-action`   | suggestion | -          | warn        |
| `no-process-cwd`           | suggestion | -          | warn        |
| `padding-between-tasks`    | layout     | whitespace | warn        |
| `prefer-builtin-task`      | suggestion | -          | false       |
