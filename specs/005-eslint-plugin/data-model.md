# Data Model: ESLint Plugin for Nadle

## Core Entities

### Rule Module

Each ESLint rule is a module exporting a `RuleModule` object:

- **name**: Rule identifier (e.g., `no-duplicate-task-names`)
- **meta**: Metadata object
  - **type**: `"problem"` | `"suggestion"` | `"layout"`
  - **docs**: Description, recommended severity, URL
  - **messages**: Named message templates for diagnostics
  - **fixable**: `"code"` | `"whitespace"` | undefined
  - **schema**: JSON schema for rule options (empty array for most rules)
- **defaultOptions**: Default rule options (empty array for most rules)
- **create(context)**: Factory returning AST visitor object

### Plugin Object

The exported plugin structure:

- **meta**: `{ name: "eslint-plugin-nadle", version: string }`
- **rules**: Map of rule name → rule module
- **configs**: Map of preset name → flat config object
  - **recommended**: Scoped to `nadle.config.*`, mixed severity
  - **all**: Scoped to `nadle.config.*`, all rules at error

### Config Preset

Each preset is a flat config object:

- **files**: `["**/nadle.config.*"]`
- **plugins**: `{ nadle: plugin }`
- **rules**: Map of `nadle/rule-name` → severity level

## AST Patterns Analyzed

### Task Registration Call

```
CallExpression
  callee: MemberExpression
    object: Identifier(name: "tasks")
    property: Identifier(name: "register")
  arguments[0]: StringLiteral (task name)
  arguments[1]?: FunctionExpression | ArrowFunctionExpression | Identifier (task fn or task type)
  arguments[2]?: Expression (options resolver for typed tasks)
```

### Configuration Builder Call

```
CallExpression
  callee: MemberExpression
    object: CallExpression (the tasks.register() return value)
    property: Identifier(name: "config")
  arguments[0]: ObjectExpression
    properties: dependsOn, description, inputs, outputs, group, env, workingDir
```

### Task Action Scope

Two forms of task action functions:

1. **Function form**: Second argument to `tasks.register(name, fn)`
2. **Typed task form**: `run` method property in `defineTask({ run: ... })` object

## Rule Categories

| Category      | Rules                                                                                                              | Type       |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- |
| Correctness   | `no-anonymous-tasks`, `no-duplicate-task-names`, `no-circular-dependencies`, `valid-task-name`, `valid-depends-on` | problem    |
| Best Practice | `require-task-description`, `require-task-inputs`, `no-sync-in-task-action`, `no-process-cwd`                      | suggestion |
| Style         | `padding-between-tasks`                                                                                            | layout     |
| Suggestion    | `prefer-builtin-task`                                                                                              | suggestion |
