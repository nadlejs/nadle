# Nadle for VS Code

Language support for [`nadle.config.ts`](https://nadle.dev) files, powered by the Nadle Language Server.

## Features

- **Diagnostics** — invalid task names, duplicate registrations, and unresolved `dependsOn` references are reported in real time.
- **Autocompletion** — task name suggestions inside `dependsOn` arrays.
- **Hover information** — hover over a task name in `dependsOn` to see its summary.
- **Go to Definition** — Ctrl+click (Cmd+click on macOS) a `dependsOn` reference to jump to its registration.

## Supported Files

The extension activates on all Nadle config file formats:

- `nadle.config.ts` / `nadle.config.mts` / `nadle.config.cts`
- `nadle.config.js` / `nadle.config.mjs` / `nadle.config.cjs`

## Development

1. Build the LSP server:

   ```sh
   pnpm -F @nadle/language-server build:tsup
   ```

2. Build the VS Code extension:

   ```sh
   pnpm -F nadle-vscode-extension build
   ```

3. Press **F5** in VS Code (from the repo root) to launch the Extension Development Host.

4. Open any project containing a `nadle.config.ts` file — the extension activates automatically.
