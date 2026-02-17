# LSP Capabilities Contract

## Server Capabilities (InitializeResult)

The Nadle LSP server advertises these capabilities during initialization:

```jsonc
{
	"capabilities": {
		// Track open/changed files incrementally
		"textDocumentSync": {
			"openClose": true,
			"change": 2, // TextDocumentSyncKind.Incremental
			"save": { "includeText": false }
		},

		// Completion for task names in dependsOn
		"completionProvider": {
			"triggerCharacters": ["\"", "'"],
			"resolveProvider": false
		},

		// Hover for task name strings
		"hoverProvider": true,

		// Go-to-definition for dependsOn references
		"definitionProvider": true
	}
}
```

## Diagnostic Contract

Diagnostics are pushed via `textDocument/publishDiagnostics` on every document change (debounced 200ms).

### Diagnostic Codes

| Code                          | Severity | Message Pattern                                                                  | Trigger |
| ----------------------------- | -------- | -------------------------------------------------------------------------------- | ------- |
| `nadle/invalid-task-name`     | Error    | `Task name "{name}" is invalid. Names must match /^[a-z]([a-z0-9-]*[a-z0-9])?$/` | FR-001  |
| `nadle/duplicate-task-name`   | Error    | `Task "{name}" is already registered at line {line}`                             | FR-002  |
| `nadle/unresolved-dependency` | Warning  | `Task "{name}" is not registered in this file`                                   | FR-003  |

### Diagnostic Range

Each diagnostic's range spans exactly the string literal (excluding quotes for task names, including quotes for dependsOn references).

## Completion Contract

Triggered inside string literals within `dependsOn` arrays/values.

### Completion Items

| Field      | Value                                                                       |
| ---------- | --------------------------------------------------------------------------- |
| label      | Task name (e.g., `"build"`)                                                 |
| kind       | CompletionItemKind.Value (12)                                               |
| detail     | Task form and description (e.g., `"typed (ExecTask) — Compile TypeScript"`) |
| sortText   | Task name (alphabetical)                                                    |
| filterText | Task name                                                                   |

### Filtering Rules

- Exclude the current task's own name (FR-006)
- Include all string-literal task names from the file

## Hover Contract

Triggered on string literals that are task names (in `tasks.register()` first arg or in `dependsOn`).

### Hover Content (Markdown)

```markdown
**task-name** _(typed: ExecTask)_

Description text if available

---

**Dependencies**: lint, compile
**Group**: build
**Inputs**: declared
**Outputs**: declared
```

Omit sections with no data (e.g., no description → skip that line).

## Definition Contract

Triggered on string literals inside `dependsOn` values.

### Definition Location

Returns the `Location` of the corresponding `tasks.register("name", ...)` call — specifically, the range of the entire `tasks.register(...)` expression.

Returns empty result if:

- The referenced task name is not found in the file
- The dependency reference is workspace-qualified (contains `:`)

## File Activation

The LSP activates for files matching these patterns:

- `nadle.config.ts`
- `nadle.config.js`
- `nadle.config.mjs`
- `nadle.config.mts`
