# Data Model: `@nadle/kernel`

## Types

### WorkspaceIdentity

The minimal workspace representation needed for resolution logic.

| Field          | Type     | Description                                                           |
| -------------- | -------- | --------------------------------------------------------------------- |
| `id`           | `string` | Unique identifier derived from relative path (e.g., `"packages:foo"`) |
| `label`        | `string` | Human-readable display label (may differ from id due to aliases)      |
| `relativePath` | `string` | Path relative to project root (e.g., `"packages/foo"`)                |

**Identity rule**: `id` is unique across all workspaces. `label` is unique across all workspaces (enforced by validation).

**Root workspace**: Always has `id = "root"`, `label = ""`, `relativePath = "."`.

### TaskReference (parsed)

Result of parsing a task reference string.

| Field            | Type                  | Description                                                                             |
| ---------------- | --------------------- | --------------------------------------------------------------------------------------- |
| `taskName`       | `string`              | The task name (last colon-delimited segment)                                            |
| `workspaceInput` | `string \| undefined` | Workspace qualifier (all segments before the last colon), or `undefined` if unqualified |

### AliasOption

Configuration input for workspace aliases.

| Variant    | Type                                             | Description                             |
| ---------- | ------------------------------------------------ | --------------------------------------- |
| Object map | `Record<string, string>`                         | Maps workspace relative paths to labels |
| Function   | `(workspacePath: string) => string \| undefined` | Returns label or undefined              |
| Undefined  | `undefined`                                      | No aliases configured                   |

## Constants

| Name                      | Value                               | Description                                          |
| ------------------------- | ----------------------------------- | ---------------------------------------------------- |
| `ROOT_WORKSPACE_ID`       | `"root"`                            | The root workspace always has this ID                |
| `COLON`                   | `":"`                               | Separator used in task identifiers and workspace IDs |
| `VALID_TASK_NAME_PATTERN` | `/^[a-z](?:[a-z0-9-]*[a-z0-9])?$/i` | Canonical task name validation regex                 |

## Relationships

```
WorkspaceIdentity (1) ──has many──> TaskIdentifier (string)
AliasOption ──configures──> WorkspaceIdentity.label
TaskReference.workspaceInput ──resolves to──> WorkspaceIdentity (by id or label)
```
