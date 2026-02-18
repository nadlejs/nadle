# Implementation Plan: Instance-Scoped Registries

**Branch**: `002-instance-scoped-registries` | **Date**: 2026-02-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-instance-scoped-registries/spec.md`

## Summary

Replace global singleton registries (`taskRegistry`, `fileOptionRegistry`) with
per-Nadle-instance registries. Use `AsyncLocalStorage` to bind the active Nadle
instance during config file loading so that `tasks.register()` and `configure()`
route to the correct instance without changing the public API. Optimize worker
threads to cache their Nadle instance per thread, eliminating config re-loading
on subsequent task dispatches.

## Technical Context

**Language/Version**: TypeScript strict, ESM-only, targeting Node 22+
**Primary Dependencies**: tinypool (worker threads), jiti (config transpilation), AsyncLocalStorage (node:async_hooks — new)
**Storage**: N/A (filesystem cache in `.nadle/` unchanged)
**Testing**: vitest, integration-first (spawn CLI via execa)
**Target Platform**: Node.js 22+ on Ubuntu, macOS, Windows
**Project Type**: Monorepo (pnpm workspaces), single core package
**Performance Goals**: Worker startup amortized to once per thread (not per task)
**Constraints**: Bundle ≤140 KB, max 200 lines/file, no public API changes
**Scale/Scope**: ~11 source files modified, 1 new file, ~32 test fixture configs unmodified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Over Configuration | Pass | No config format changes |
| II. Type Safety First | Pass | All types preserved; TaskRegistry/FileOptionRegistry types unchanged |
| III. Lightweight and Focused | Pass | AsyncLocalStorage is a Node built-in (zero bundle cost) |
| IV. Integration-First Testing | Pass | All existing integration tests must pass; new isolation test added |
| V. Self-Hosting (Dogfooding) | Pass | `npx nadle build` must still work (self-hosting) |
| VI. Modern ESM and Strict Conventions | Pass | `node:async_hooks` follows PascalCase import convention |
| VII. Cross-Platform Correctness | Pass | AsyncLocalStorage is cross-platform; no path changes |

## Project Structure

### Documentation (this feature)

```text
specs/002-instance-scoped-registries/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 quickstart guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (files to modify)

```text
packages/nadle/src/
├── core/
│   ├── nadle.ts                          # Modify: own registries, wrap init in context
│   ├── nadle-context.ts                  # NEW: AsyncLocalStorage binding
│   ├── context.ts                        # Modify: add fileOptionRegistry to ProjectContext
│   ├── registration/
│   │   ├── task-registry.ts              # Modify: remove singleton export
│   │   ├── file-option-registry.ts       # Modify: remove singleton, export class
│   │   └── api.ts                        # Modify: delegate to getCurrentInstance()
│   ├── options/
│   │   ├── configure.ts                  # Modify: delegate to getCurrentInstance()
│   │   └── options-resolver.ts           # Modify: receive fileOptionRegistry from Nadle
│   └── engine/
│       └── worker.ts                     # Modify: cache Nadle per thread, use instance registry
├── spec/
│   ├── 01-task.md                        # Update: remove "singleton" language
│   ├── 04-execution.md                   # Update: describe worker caching
│   ├── 08-configuration-loading.md       # Update: describe context binding
│   ├── CHANGELOG.md                      # Update: add entry
│   └── README.md                         # Update: patch version bump
```

**Structure Decision**: No new directories. One new file (`nadle-context.ts`) in
the existing `core/` directory. All other changes are modifications to existing files.

## Overall Approach

The refactor has three layers, each building on the previous:

### Layer 1: AsyncLocalStorage Context Binding

Create a new module `nadle-context.ts` that provides:
- `runWithInstance(instance, fn)` — runs `fn` with `instance` bound in AsyncLocalStorage
- `getCurrentInstance()` — retrieves the bound instance or throws (FR-009)

This is the foundation. It enables the `tasks` and `configure` exports to find
the correct Nadle instance without changing their call signatures.

### Layer 2: Instance-Owned Registries

Move registry ownership from module-level singletons to Nadle instance properties:
- `Nadle.taskRegistry = new TaskRegistry()` (fresh per instance)
- `Nadle.fileOptionRegistry = new FileOptionRegistry()` (fresh per instance)

Update the `tasks` DSL and `configure()` function to delegate to
`getCurrentInstance().taskRegistry` / `getCurrentInstance().fileOptionRegistry`.

Update `OptionsResolver` to receive both registries from the Nadle instance
instead of importing globals.

Remove the singleton exports from `task-registry.ts` and `file-option-registry.ts`.

### Layer 3: Worker Thread Optimization

Restructure `worker.ts` to cache its Nadle instance at module level:
- First task dispatch: create + initialize Nadle (loads configs once)
- Subsequent dispatches: reuse the cached instance (no config re-load)

The worker's Nadle instance owns its own registries (per Layer 2), populated
during the one-time config loading. Config files call `tasks.register()` which
routes to the worker's instance via AsyncLocalStorage (per Layer 1).

### Execution Order

Layer 1 → Layer 2 → Layer 3 (sequential, each depends on the previous).
Within each layer, file changes can be parallelized.

### Risk: Worker Cache Invalidation

If a worker's cached Nadle instance becomes stale (e.g., the main thread detects
a config change between runs), the cache must be invalidated. For now, this is
not a concern because Nadle is a CLI tool — each CLI invocation creates a fresh
pool. Workers are destroyed at the end of each run. The cache only persists
within a single CLI execution.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
