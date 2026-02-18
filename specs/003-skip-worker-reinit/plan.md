# Implementation Plan: Skip Redundant Worker Re-Initialization

**Branch**: `003-skip-worker-reinit` | **Date**: 2026-02-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-skip-worker-reinit/spec.md`

## Summary

Worker threads currently run the full `OptionsResolver.resolve()` pipeline on first dispatch,
which includes filesystem walks for workspace discovery, monorepo tool detection, option
merging, worker count resolution, and task input resolution — all of which the main thread
already completed. This plan introduces a lightweight `initForWorker(resolvedOptions)` method
on the `Nadle` class that bypasses redundant work and only loads config files (for task
function closures) using the already-resolved project structure from the main thread.

## Technical Context

**Language/Version**: TypeScript, ESM, targeting Node 22+
**Primary Dependencies**: tinypool (worker threads), jiti (config file loading), AsyncLocalStorage (instance binding)
**Storage**: N/A (filesystem cache unchanged)
**Testing**: vitest, integration-first (CLI via execa), 326+ tests
**Target Platform**: Linux, macOS, Windows (cross-platform)
**Project Type**: Monorepo (pnpm workspaces)
**Performance Goals**: Eliminate redundant filesystem walks and option resolution per worker thread
**Constraints**: <200 lines/file, <50 lines/function, <10 complexity, <3 params, 140 KB bundle limit
**Scale/Scope**: 2 source files modified, 1 spec file updated

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Status | Notes                                                     |
| ------------------------------------- | ------ | --------------------------------------------------------- |
| I. Code Over Configuration            | PASS   | No configuration changes; all logic remains in TypeScript |
| II. Type Safety First                 | PASS   | New method is fully typed; no public API changes          |
| III. Lightweight and Focused          | PASS   | No new dependencies; reduces work done at runtime         |
| IV. Integration-First Testing         | PASS   | Validated by existing 326+ integration tests              |
| V. Self-Hosting (Dogfooding)          | PASS   | Nadle builds itself; change is transparent                |
| VI. Modern ESM and Strict Conventions | PASS   | ESM only, PascalCase node imports, no process.cwd()       |
| VII. Cross-Platform Correctness       | PASS   | No platform-specific code; paths from resolved options    |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-skip-worker-reinit/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── spec.md              # Feature specification
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (files to modify)

```text
packages/nadle/src/core/
├── nadle.ts                        # Add initForWorker() method
└── engine/
    └── worker.ts                   # Update getOrCreateNadle() to use initForWorker()

spec/
├── 04-execution.md                 # Update worker execution flow description
└── CHANGELOG.md                    # Add entry for this change
```

**Structure Decision**: No new files or directories. This is a surgical modification to
two existing source files plus a spec update.

## Architecture: Current vs Optimized Init Path

### Current Worker Init (per first dispatch per thread)

```
getOrCreateNadle(options)
  └── new Nadle(cliOptions).init()
        └── OptionsResolver.resolve(cliOptions)
              ├── logger.configure()
              ├── ProjectResolver.resolve()          ← REDUNDANT
              │     ├── initProject()                 ← filesystem walks, monorepo detection
              │     ├── initializeRootWorkspace()     ← find config file + load via jiti
              │     ├── initializeSubWorkspaces()     ← loop workspaces + load configs
              │     └── resolveCurrentWorkspaceId()   ← not needed in worker
              ├── taskRegistry.configure(project)
              ├── resolveWorkers()                    ← REDUNDANT (already resolved)
              └── resolveTasks()                      ← REDUNDANT (worker uses task IDs)
```

### Optimized Worker Init (per first dispatch per thread)

```
getOrCreateNadle(options)
  └── new Nadle(cliOptions).initForWorker(resolvedOptions)
        ├── this.#options = resolvedOptions           ← direct assignment
        ├── logger.configure(resolvedOptions)
        └── runWithInstance(this, async () => {
              ├── onConfigureWorkspace(rootId)
              ├── fileReader.read(rootConfigFile)     ← load config (task closures)
              ├── for each workspace with config:
              │     ├── onConfigureWorkspace(wsId)
              │     └── fileReader.read(wsConfigFile)
              └── taskRegistry.configure(project)     ← flush buffer to registry
            })
```

**What is eliminated**:

- `ProjectResolver.initProject()` — filesystem walks, `findUp`, `@manypkg/find-root`, monorepo tool detection
- `ProjectResolver.resolveCurrentWorkspaceId()` — cwd-to-workspace mapping (irrelevant in worker)
- `OptionsResolver.resolveWorkers()` — re-resolving min/max worker counts
- `OptionsResolver.resolveTasks()` — re-resolving task inputs from CLI args
- `FileOptionRegistry` usage — option merging is skipped entirely
- Config file path searching — paths are already known from resolved project

**What is preserved**:

- Config file loading via jiti — task functions are closures that must be loaded per thread
- `runWithInstance()` / AsyncLocalStorage — routes `tasks.register()` to the correct instance
- `taskRegistry.configure(project)` — flushes buffered tasks to final registry with labels
- Per-thread Nadle caching — `getOrCreateNadle` still checks `workerNadle` before init
