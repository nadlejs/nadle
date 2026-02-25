# Contract: Cache Eviction

## Configuration

| Source        | Field             | Default | Description                        |
| ------------- | ----------------- | ------- | ---------------------------------- |
| `configure()` | `maxCacheEntries` | 5       | Global per-task entry limit        |
| `.config()`   | `maxCacheEntries` | —       | Per-task override (takes priority) |

## Trigger

Eviction runs after every successful cache save (`CacheManager.writeRunMetadata()`).

## Algorithm

1. List all subdirectories under `tasks/{encodedTaskId}/runs/`.
2. If count <= `maxCacheEntries`, return (no eviction needed).
3. For each run directory, read `metadata.json` and extract `timestamp`.
4. Sort runs by timestamp descending (newest first).
5. Identify the `latest` cache key from `tasks/{encodedTaskId}/metadata.json`.
6. Starting from the oldest run, delete run directories until count <= `maxCacheEntries`.
7. Never delete the run pointed to by `latest`, even if it's not the newest by timestamp.

## Rules

1. Eviction MUST NOT block task execution — it runs after the cache save completes.
2. Eviction errors (e.g., permission denied on delete) MUST be logged as warnings,
   not thrown.
3. The `latest` entry is always preserved regardless of age or position.
4. If `maxCacheEntries` is 0 or negative, eviction is disabled (no limit).
5. Eviction operates per-task — it never crosses task boundaries.
