---
description: Get real-time diagnostics, autocompletion, and hover info for nadle.config.ts with the Nadle Language Server and VS Code extension.
keywords: [nadle, editor, LSP, VS Code, language server, IntelliSense]
---

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

## VS Code

Install the [Nadle extension](https://marketplace.visualstudio.com/items?itemName=nadlejs.vscode-extension) from the VS Code Marketplace. The extension bundles the language server — no additional setup is needed.

## Neovim

Install the language server:

```sh
npm install -g @nadle/language-server
```

Neovim 0.11+ has built-in LSP support via `vim.lsp.config`. Add the following to your Neovim configuration:

```lua
vim.lsp.config["nadle"] = {
  cmd = { "language-server" },
  filetypes = { "typescript", "javascript" },
  root_markers = { "nadle.config.ts", "nadle.config.js" },
}
vim.lsp.enable("nadle")
```

## Zed

Install the language server:

```sh
npm install -g @nadle/language-server
```

Add a `nadle` entry under `lsp` in your Zed `settings.json`:

```json
{
	"lsp": {
		"nadle": {
			"binary": {
				"path": "language-server"
			}
		}
	}
}
```

## Helix

Install the language server:

```sh
npm install -g @nadle/language-server
```

Add the following to your `languages.toml`:

```toml
[language-server.nadle]
command = "language-server"

[[language]]
name = "typescript"
language-servers = ["typescript-language-server", "nadle"]
```

:::tip
Any LSP-capable editor works — point it to `language-server` as the server command. The server communicates over stdio, so no port configuration is needed.
:::
