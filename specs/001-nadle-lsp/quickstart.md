# Quickstart: Nadle LSP Development

## Prerequisites

- Node.js 22+
- pnpm (workspace manager)
- The Nadle monorepo cloned and dependencies installed (`pnpm install`)

## Package Setup

The LSP lives at `packages/nadle-lsp/` in the monorepo.

```bash
# After creating the package structure:
pnpm install                          # Link workspace dependencies
pnpm -F nadle-lsp build:tsup          # Build the LSP server
pnpm -F nadle-lsp test                # Run tests
```

## Architecture Overview

```
packages/nadle-lsp/
├── src/
│   ├── index.ts              # Public API (analyzer exports for testing/reuse)
│   ├── server.ts             # LSP server entry (createConnection, capabilities)
│   ├── analyzer.ts           # AST parsing: find tasks.register() calls, extract config
│   ├── diagnostics.ts        # Validation: name pattern, duplicates, unresolved deps
│   ├── completions.ts        # Completion provider: task names in dependsOn
│   ├── hover.ts              # Hover provider: task summary tooltips
│   └── definitions.ts        # Definition provider: go-to-definition for deps
├── test/
│   ├── __fixtures__/         # Sample nadle.config.ts files for testing
│   ├── analyzer.test.ts      # Unit tests for AST analysis
│   └── server.test.ts        # Integration tests via LSP protocol
└── lib/                      # Build output
```

## Key Concepts

### 1. Analyzer (core logic, no LSP dependency)

The analyzer parses a config file string into a `DocumentAnalysis`:

```typescript
import { analyzeDocument } from "nadle-lsp";

const analysis = analyzeDocument(fileContent, "nadle.config.ts");
// analysis.registrations — all tasks.register() calls found
// analysis.taskNames — Map<string, TaskRegistration[]> for lookup
```

### 2. Server (LSP transport)

The server wraps the analyzer and translates between LSP protocol and analysis results:

```typescript
// server.ts — entry point for the LSP
import { createConnection, TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

// On document change → re-analyze → push diagnostics
// On completion request → read cached analysis → return task names
// On hover request → read cached analysis → return task summary
// On definition request → read cached analysis → return location
```

### 3. Testing Pattern

```typescript
// Unit test (analyzer only, no LSP)
import { analyzeDocument } from "../src/analyzer.js";

test("detects duplicate task names", () => {
	const code = `
    import { tasks } from "nadle";
    tasks.register("build", async () => {});
    tasks.register("build", async () => {});
  `;
	const analysis = analyzeDocument(code, "nadle.config.ts");
	expect(analysis.taskNames.get("build")).toHaveLength(2);
});
```

## Running the LSP

```bash
# Build
pnpm -F nadle-lsp build:tsup

# Run via stdio (editors will launch this automatically)
node packages/nadle-lsp/lib/server.js --stdio
```

## Testing with an Editor

For manual testing during development, configure your editor to use the built server:

**VS Code** (via a temporary launch config — full extension is a separate future spec):

```jsonc
// .vscode/settings.json (temporary, for development only)
{
	"nadle-lsp.serverPath": "./packages/nadle-lsp/lib/server.js"
}
```

**Neovim** (via `nvim-lspconfig`):

```lua
require("lspconfig").nadle_lsp.setup({
  cmd = { "node", "packages/nadle-lsp/lib/server.js", "--stdio" },
  filetypes = { "typescript", "javascript" },
  root_dir = function(fname)
    return vim.fn.fnamemodify(fname, ":h")
  end,
})
```
