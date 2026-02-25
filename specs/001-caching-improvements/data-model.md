# Data Model: Caching Improvements

**Branch**: `001-caching-improvements` | **Date**: 2026-02-24

## Entity Changes

### CacheKey (modified)

The cache key hash input expands from 3 fields to 5:

| Field                    | Type                      | Status   | Description                                    |
| ------------------------ | ------------------------- | -------- | ---------------------------------------------- |
| `taskId`                 | `string`                  | Existing | Task identifier                                |
| `inputsFingerprints`     | `Record<string, string>`  | Existing | Map of file path to SHA-256 hash               |
| `env`                    | `Record<string, string>?` | Existing | Task environment variables                     |
| `options`                | `object?`                 | **New**  | Resolved task options from optionsResolver     |
| `dependencyFingerprints` | `Record<string, string>?` | **New**  | Map of dependency taskId to outputsFingerprint |

**Validation**: All fields are passed through `hashObject()` with unordered comparison.
`options` and `dependencyFingerprints` are omitted from hash when undefined.

### WorkerMessage (modified)

| Field                | Type      | Status   | Description                                |
| -------------------- | --------- | -------- | ------------------------------------------ |
| `type`               | `string`  | Existing | "start", "up-to-date", "from-cache"        |
| `threadId`           | `number`  | Existing | Worker thread ID                           |
| `outputsFingerprint` | `string?` | **New**  | Combined output hash, posted on completion |

The `outputsFingerprint` is posted in two scenarios:

- After cache-miss execution + save: the newly computed outputs fingerprint
- After up-to-date/from-cache validation: the existing outputs fingerprint from metadata

Not posted when task is not-cacheable or caching is disabled.

### WorkerParams (modified)

| Field                    | Type                     | Status   | Description                                   |
| ------------------------ | ------------------------ | -------- | --------------------------------------------- |
| `taskId`                 | `string`                 | Existing | Task identifier                               |
| `port`                   | `MessagePort`            | Existing | Communication channel                         |
| `env`                    | `NodeJS.ProcessEnv`      | Existing | Process environment                           |
| `options`                | `NadleResolvedOptions`   | Existing | Resolved nadle options                        |
| `dependencyFingerprints` | `Record<string, string>` | **New**  | Output fingerprints of completed dependencies |

### TaskConfiguration (modified)

| Field             | Type                       | Status   | Description                                |
| ----------------- | -------------------------- | -------- | ------------------------------------------ |
| `dependsOn`       | `MaybeArray<string>?`      | Existing | Task dependencies                          |
| `env`             | `TaskEnv?`                 | Existing | Environment variables                      |
| `workingDir`      | `string?`                  | Existing | Working directory                          |
| `inputs`          | `MaybeArray<Declaration>?` | Existing | Input declarations                         |
| `outputs`         | `MaybeArray<Declaration>?` | Existing | Output declarations                        |
| `group`           | `string?`                  | Existing | Task group                                 |
| `description`     | `string?`                  | Existing | Description                                |
| `maxCacheEntries` | `number?`                  | **New**  | Per-task eviction limit (overrides global) |

### NadleFileOptions (modified)

| Field             | Type      | Status  | Description                        |
| ----------------- | --------- | ------- | ---------------------------------- |
| `maxCacheEntries` | `number?` | **New** | Global eviction limit (default: 5) |

### RunCacheMetadata (unchanged)

| Field                | Type                     | Description                             |
| -------------------- | ------------------------ | --------------------------------------- |
| `version`            | `1`                      | Schema version                          |
| `taskId`             | `string`                 | Task identifier                         |
| `cacheKey`           | `string`                 | 64-char hex hash                        |
| `timestamp`          | `string`                 | ISO 8601                                |
| `inputsFingerprints` | `Record<string, string>` | Map of file path to SHA-256             |
| `outputsFingerprint` | `string`                 | SHA-256 of combined output fingerprints |

No schema version bump needed — the metadata structure is unchanged.
Cache key changes naturally cause cache misses (different hash).

### CacheValidatorContext (modified)

| Field                    | Type                     | Status   | Description                                   |
| ------------------------ | ------------------------ | -------- | --------------------------------------------- |
| `cache`                  | `boolean`                | Existing | Whether caching is enabled                    |
| `cacheDir`               | `string`                 | Existing | Cache directory path                          |
| `projectDir`             | `string`                 | Existing | Project root directory                        |
| `workingDir`             | `string`                 | Existing | Task working directory                        |
| `configFiles`            | `string[]`               | Existing | Config file paths for implicit inputs         |
| `taskOptions`            | `object?`                | **New**  | Resolved task options                         |
| `dependencyFingerprints` | `Record<string, string>` | **New**  | Output fingerprints of completed dependencies |
| `maxCacheEntries`        | `number`                 | **New**  | Eviction limit for this task                  |

## State Transitions

### Task Output Fingerprint Collection (new state in TaskPool)

```
Task dispatched to worker
    │
    ▼
Worker executes / validates cache
    │
    ▼
Worker posts WorkerMessage { ..., outputsFingerprint? }
    │
    ▼
TaskPool stores fingerprint in Map<taskId, string>
    │
    ▼
TaskPool dispatches dependent tasks with collected dependency fingerprints
```

### Cache Eviction Flow (new)

```
CacheManager.writeRunMetadata() completes
    │
    ▼
CacheManager.evict(taskId, maxCacheEntries)
    │
    ▼
Read runs/ directory entries
    │
    ▼
Count > maxCacheEntries?
    ├── No  → return (no eviction)
    └── Yes → Sort by timestamp, delete oldest beyond limit
              (never delete entry pointed to by "latest")
```

## Concurrency Model

### File I/O Semaphore (new utility)

A simple promise-based concurrency limiter with a configurable slot count (default: 64).
Used by `CacheManager.saveOutputs()` and `CacheManager.restoreOutputs()`.

Does not require external dependencies — implemented as a ~15 line utility function.
