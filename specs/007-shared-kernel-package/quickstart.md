# Quickstart: `@nadle/kernel`

## Setup

The package lives at `packages/kernel/` in the monorepo. It's a pnpm workspace package with zero runtime dependencies.

```bash
# Install after adding to pnpm-workspace.yaml (already covered by packages/**)
pnpm install
```

## Usage — Nadle Core

After extraction, nadle core imports from `@nadle/kernel` instead of its own internal modules:

```typescript
// Before (internal)
import { TaskIdentifier } from "../models/task-identifier.js";
import { COLON } from "../utilities/constants.js";

// After (shared kernel)
import { parseTaskReference, composeTaskIdentifier } from "@nadle/kernel";
```

## Usage — Language Server (future)

```typescript
import { parseTaskReference, resolveWorkspace, isWorkspaceQualified, type WorkspaceIdentity } from "@nadle/kernel";

// In definitions.ts, instead of skipping workspace-qualified refs:
const ref = parseTaskReference(dependsOnString);
if (ref.workspaceInput) {
	const workspace = resolveWorkspace(ref.workspaceInput, allWorkspaces);
	// Navigate to workspace's config file...
}
```

## Usage — ESLint Plugin (future)

```typescript
import { VALID_TASK_NAME_PATTERN, isWorkspaceQualified } from "@nadle/kernel";

// In valid-task-name rule, use the canonical pattern:
if (!VALID_TASK_NAME_PATTERN.test(taskName)) {
  context.report({ ... });
}
```

## Running Tests

```bash
pnpm -F @nadle/kernel test
```

## Key Design Decisions

1. **Minimal types**: `WorkspaceIdentity` has only `id`, `label`, `relativePath`. Consumers extend it.
2. **Generic resolution**: `resolveWorkspace<W extends WorkspaceIdentity>()` preserves consumer's extended type.
3. **Plain Error throws**: No dependency on `NadleError` or `Messages`. Consumers catch and re-wrap.
4. **Single entry point**: All exports from `src/index.ts`.
