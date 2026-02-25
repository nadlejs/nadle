# Implementation Plan: Caching Improvements

**Branch**: `001-caching-improvements` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-caching-improvements/spec.md`

## Summary

Improve Nadle's caching correctness, robustness, and performance by:

1. Including dependency output fingerprints in cache keys (fixes false cache hits, #248)
2. Including resolved task options in cache keys (#246)
3. Adding per-task LRU cache eviction (#442)
4. Adding corruption recovery with graceful fallback
5. Bounding file I/O concurrency for large output sets
6. Deduplicating and parallelizing input fingerprinting

The design threads dependency fingerprints through the existing worker protocol (WorkerMessage
→ TaskPool collection → WorkerParams) and extends CacheKey computation with two new fields.
No new external dependencies. All changes are within existing file boundaries (max 200 LOC).

## Technical Context

**Language/Version**: TypeScript 5.9.3, ESM only, target node22
**Primary Dependencies**: tinypool (workers), object-hash (hashing), fast-glob (declarations)
**Storage**: Filesystem-based cache under `node_modules/.cache/nadle/`
**Testing**: vitest with thread pool, integration-first (CLI spawn + custom matchers)
**Target Platform**: Ubuntu, macOS, Windows (Node 22/24)
**Project Type**: Monorepo (pnpm workspaces)
**Performance Goals**: Cache validation < 100ms for typical tasks, I/O safe up to 10k files
**Constraints**: Bundle < 140 KB, max 200 LOC/file, max 50 LOC/function, max 3 params
**Scale/Scope**: 6 source files modified, 2 new utility functions, ~6 new test files

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Status | Notes                                                                                           |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| I. Code Over Configuration            | PASS   | `maxCacheEntries` is set via TypeScript `configure()` / `.config()`, not YAML/JSON              |
| II. Type Safety First                 | PASS   | All new fields are typed; CacheKeyInput, WorkerParams, WorkerMessage extended with strict types |
| III. Lightweight and Focused          | PASS   | No new dependencies; inline semaphore ~15 LOC; no speculative features                          |
| IV. Integration-First Testing         | PASS   | Tests will spawn CLI and assert on cache behavior (hit/miss/evict) via custom matchers          |
| V. Self-Hosting                       | PASS   | Changes are internal to caching; nadle.config.ts at root already uses caching                   |
| VI. Modern ESM and Strict Conventions | PASS   | ESM, PascalCase node imports, no process.cwd(), no direct consola                               |
| VII. Cross-Platform Correctness       | PASS   | Atomic writes via rename (POSIX + NTFS), path handling via node:path                            |

**Post-Phase 1 re-check**: All principles still pass. Inline semaphore avoids dependency.
Atomic write utility fits in existing `utilities/` directory. No file exceeds 200 LOC.

## Project Structure

### Documentation (this feature)

```text
specs/001-caching-improvements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── cache-key.md
│   ├── worker-protocol.md
│   └── eviction.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/nadle/src/core/
├── caching/
│   ├── cache-validator.ts          # Modified: accept options + dependency fingerprints
│   └── cache-manager.ts            # Modified: atomic writes, eviction, concurrency limits
├── engine/
│   ├── worker.ts                   # Modified: pass options/deps to validator, post fingerprint
│   └── task-pool.ts                # Modified: collect fingerprints, pass to downstream workers
├── models/cache/
│   ├── cache-key.ts                # Modified: add options + dependencyFingerprints fields
│   └── fingerprint.ts              # Modified: parallel declaration resolution, deduplication
├── interfaces/
│   └── task-configuration.ts       # Modified: add maxCacheEntries field
├── options/
│   ├── cli-options.ts              # Modified: add maxCacheEntries default
│   └── options-resolver.ts         # Modified: resolve maxCacheEntries
└── utilities/
    ├── concurrency.ts              # New: inline semaphore for bounded Promise.all
    └── atomic-write.ts             # New: write-then-rename utility

packages/nadle/test/
├── features/caching/
│   ├── dependency-fingerprint.test.ts   # New: dependency output invalidation
│   ├── options-in-cache.test.ts         # New: task options invalidation
│   ├── eviction.test.ts                 # New: per-task LRU eviction
│   └── corruption-recovery.test.ts      # New: graceful corruption handling
├── __configs__/
│   ├── cache-dependency.ts              # New: fixture config for dependency tests
│   └── cache-options.ts                 # New: fixture config for options tests
└── unit/
    └── concurrency.test.ts              # New: unit test for semaphore utility

spec/
├── 05-caching.md                   # Updated: new cache key fields, eviction, corruption
├── CHANGELOG.md                    # Updated: new version entry
└── README.md                       # Updated: version bump

packages/docs/docs/
├── concepts/caching.md             # Updated: dependency inputs, options, eviction
├── config-reference.md             # Updated: maxCacheEntries option
└── getting-started/features.md     # Updated: caching feature description
```

**Structure Decision**: All changes fit within the existing monorepo structure. Two new utility
files in `src/core/utilities/` (each < 30 LOC). Four new test files following existing patterns.
No new packages or directories outside established conventions.

## Complexity Tracking

No constitution violations. All changes fit within existing constraints.
