# Quickstart: Instance-Scoped Registries

## What Changes for Users

**Nothing.** Config files work exactly the same:

```ts
import { tasks, configure } from "nadle";

configure({ parallel: true });

tasks.register("build", async ({ context }) => {
  // ...
});
```

## What Changes Internally

### Before (global singletons)

```
import { taskRegistry } from "./task-registry.js";   // one shared instance
import { fileOptionRegistry } from "./file-option-registry.js";  // one shared instance

// Every Nadle instance shares the same registries
const nadle1 = new Nadle(opts);  // uses global taskRegistry
const nadle2 = new Nadle(opts);  // uses SAME global taskRegistry ← problem
```

### After (instance-scoped)

```
// Each Nadle instance owns its own registries
const nadle1 = new Nadle(opts);  // nadle1.taskRegistry = new TaskRegistry()
const nadle2 = new Nadle(opts);  // nadle2.taskRegistry = new TaskRegistry() ← isolated

// Config loading binds via AsyncLocalStorage
await runWithInstance(nadle1, async () => {
  await jiti.import("nadle.config.ts");
  // tasks.register() → routes to nadle1.taskRegistry
});
```

## Key Files to Understand

| File | Role | What changes |
|------|------|-------------|
| `nadle-context.ts` | **New** — AsyncLocalStorage binding | Created |
| `nadle.ts` | Nadle class | Owns registries, wraps init in context |
| `api.ts` | `tasks` DSL object | Delegates to `getCurrentInstance()` |
| `configure.ts` | `configure()` function | Delegates to `getCurrentInstance()` |
| `task-registry.ts` | TaskRegistry class | Remove singleton export |
| `file-option-registry.ts` | FileOptionRegistry class | Remove singleton export, export class |
| `options-resolver.ts` | Config loading | Receives both registries from Nadle |
| `worker.ts` | Worker thread | Caches Nadle instance per thread |

## How to Verify

```bash
# All existing tests must pass (no API changes)
pnpm -F nadle build:tsup && pnpm -F nadle test

# Type check
npx tsc -p packages/nadle/tsconfig.build.json --noEmit

# Bundle size must stay under 140 KB
npx size-limit
```
