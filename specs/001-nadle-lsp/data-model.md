# Data Model: Nadle LSP

## Entities

### TaskRegistration

Represents a `tasks.register()` call site discovered in the AST.

| Field             | Type                             | Description                                              |
| ----------------- | -------------------------------- | -------------------------------------------------------- |
| name              | string \| null                   | Task name (null if non-literal)                          |
| nameRange         | Range                            | Source location of the name string literal               |
| registrationRange | Range                            | Source location of the entire `tasks.register(...)` call |
| form              | "no-op" \| "function" \| "typed" | Registration form (1, 2, or 3 arguments)                 |
| taskObjectName    | string \| null                   | Name of the task object (e.g., "ExecTask") if typed form |
| configuration     | TaskConfigInfo \| null           | Extracted `.config()` data if present                    |

### TaskConfigInfo

Represents the `.config({ ... })` call attached to a registration.

| Field       | Type            | Description                          |
| ----------- | --------------- | ------------------------------------ |
| dependsOn   | DependencyRef[] | Parsed dependency references         |
| description | string \| null  | Description string if present        |
| group       | string \| null  | Group string if present              |
| hasInputs   | boolean         | Whether `inputs` property is set     |
| hasOutputs  | boolean         | Whether `outputs` property is set    |
| configRange | Range           | Source location of the config object |

### DependencyRef

Represents a string literal inside a `dependsOn` value.

| Field                | Type    | Description                           |
| -------------------- | ------- | ------------------------------------- |
| name                 | string  | The dependency task name              |
| range                | Range   | Source location of the string literal |
| isWorkspaceQualified | boolean | Whether the name contains `:`         |

### DocumentAnalysis

Cached analysis result for a single config file.

| Field         | Type                              | Description                                           |
| ------------- | --------------------------------- | ----------------------------------------------------- |
| uri           | string                            | Document URI                                          |
| version       | number                            | Document version (from LSP text sync)                 |
| registrations | TaskRegistration[]                | All discovered task registrations                     |
| taskNames     | Map\<string, TaskRegistration[]\> | Index: name → registrations (for duplicate detection) |

## Relationships

```
DocumentAnalysis 1──* TaskRegistration
TaskRegistration 1──? TaskConfigInfo
TaskConfigInfo   1──* DependencyRef
```

## Validation Rules

1. **Task name uniqueness**: If `taskNames.get(name).length > 1`, all registrations after the first are flagged as duplicates.
2. **Task name pattern**: `name` must match `^[a-z]([a-z0-9-]*[a-z0-9])?$` (case-sensitive).
3. **Dependency resolution**: Each `DependencyRef` where `isWorkspaceQualified === false` must have a matching entry in `taskNames`.
4. **Non-literal skip**: If `name === null` (non-literal argument), skip all validation for that registration.

## State Transitions

```
Document opened → parse → DocumentAnalysis created → diagnostics pushed
Document changed → debounce 200ms → re-parse → DocumentAnalysis replaced → diagnostics pushed
Document closed → DocumentAnalysis removed
```
