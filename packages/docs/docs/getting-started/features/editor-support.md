# Editor Support

Nadle provides a Language Server (LSP) that brings intelligent editing features to `nadle.config.ts` files directly in your editor. Instead of running the CLI to discover errors, you get instant feedback as you type.

## Features

### Diagnostics

The LSP validates your config file in real time and reports errors as you type:

- **Invalid task names**: Task names must start with a lowercase letter, contain only lowercase letters, numbers, and hyphens, and must not end with a hyphen. Invalid names are underlined with an error.
- **Duplicate task names**: If two `tasks.register()` calls use the same name, the duplicate is flagged.
- **Unresolved dependencies**: If a `dependsOn` reference points to a task that is not registered in the same file, a warning appears.

```ts
tasks.register("My-Task", ...); // Error: invalid task name
tasks.register("build", ...);
tasks.register("build", ...); // Error: duplicate task name

tasks
  .register("test", ...)
  .config({ dependsOn: ["buld"] }); // Warning: unresolved dependency
```

### Autocompletion

When typing inside a `dependsOn` string literal or array, the LSP suggests all task names registered in the current file. The current task's own name is excluded from suggestions to prevent self-dependencies.

### Hover Information

Hovering over a task name in a `dependsOn` value shows a tooltip with the task's summary:

- Task form (function, exec, pnpm, copy, etc.)
- Description (if configured)
- Dependencies
- Group
- Whether inputs/outputs are defined

### Go to Definition

Ctrl+click (Cmd+click on macOS) a task name in a `dependsOn` value to jump to its `tasks.register()` call in the same file.

## Supported File Formats

The LSP activates on all Nadle config file formats:

- `nadle.config.ts` / `nadle.config.mts` / `nadle.config.cts`
- `nadle.config.js` / `nadle.config.mjs` / `nadle.config.cjs`

TypeScript syntax highlighting and type-checking continue to work as normal — the Nadle LSP adds Nadle-specific intelligence on top.

## VS Code Setup

A VS Code extension is available in the `nadle-vscode` package. To use it during development:

1. Build the LSP server:

   ```sh
   pnpm -F @nadle/internal-nadle-lsp build:tsup
   ```

2. Build the VS Code extension:

   ```sh
   pnpm -F @nadle/internal-nadle-vscode build
   ```

3. Press **F5** in VS Code (from the repo root) to launch the Extension Development Host.

4. Open any project containing a `nadle.config.ts` file — the extension activates automatically.

## Other Editors

The LSP follows the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) specification and communicates over stdio. Any editor with LSP client support can use the Nadle language server by pointing it to the built `server.js` entry point.
