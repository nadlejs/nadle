# Research: Caching Improvements

**Branch**: `001-caching-improvements` | **Date**: 2026-02-24

## R1: Threading Dependency Output Fingerprints Through Workers

**Decision**: Extend WorkerMessage to include `outputsFingerprint` posted back to main thread.
Main thread collects fingerprints from completed tasks and passes them to downstream workers
via an extended `WorkerParams.dependencyFingerprints` field.

**Rationale**: Workers are isolated — they can't read each other's state. The main thread
(TaskPool) already orchestrates task ordering via `scheduler.getReadyTasks(doneTaskId)`.
Adding a fingerprint collection step between completion and next-task dispatch is minimal
code and zero new infrastructure. The alternative of having workers read dependency metadata
from disk adds filesystem coupling and race conditions.

**Flow**:

1. Worker completes task → posts `{ type: "start"|"up-to-date"|"from-cache", outputsFingerprint? }`
2. TaskPool stores fingerprint in a `Map<taskId, string>`
3. Before dispatching downstream task, TaskPool collects fingerprints from all direct dependencies
4. Passes `dependencyFingerprints: Record<taskId, string>` in WorkerParams
5. Worker passes this to CacheValidator → included in CacheKey computation

**Edge cases**:

- Task with no caching (not-cacheable): no outputsFingerprint posted → omitted from downstream key
- Task with caching disabled (--no-cache): still executes, but no fingerprint → downstream always misses
- Task that fails: no fingerprint; downstream won't be scheduled (existing behavior)

**Alternatives considered**:

- Workers read dependency cache metadata from disk: race-prone, requires CacheManager in worker
  for tasks it doesn't own
- Shared memory: overkill for a single string per task

## R2: Including Task Options in Cache Key

**Decision**: Pass resolved options into CacheValidator and include them in CacheKey.compute()
input alongside taskId, inputsFingerprints, and env.

**Rationale**: Options are already resolved in worker.ts (line 50) before cache validation
(line 54). Threading them into the cache validator requires adding one field to
CacheValidatorContext and one field to CacheKey.Input. The existing `hashObject()` with
`object-hash` handles arbitrary serializable objects deterministically.

**Flow**:

1. Worker resolves options via `optionsResolver(context)`
2. Passes options to CacheValidator constructor (new field in context or direct param)
3. CacheKey.compute includes `{ taskId, inputsFingerprints, env, options, dependencyFingerprints }`

**Edge cases**:

- No options configured: options is undefined → omitted from hash (backward-compatible for
  tasks that never had options, but old cache entries with same inputs will still miss since
  the hash input shape changed — this is intentional per spec removing FR-009)
- Non-serializable options: object-hash will throw → clear error message

**Alternatives considered**:

- Hashing options separately and including as a string: unnecessary indirection
- Only hashing specific option fields: fragile, easy to miss new fields

## R3: Eviction Strategy

**Decision**: Per-task LRU eviction with configurable `maxCacheEntries` (default: 5). Eviction
runs as a post-save step after writing a new cache entry.

**Rationale**: Per-task eviction is simple to implement and reason about. The cache directory
structure already groups entries by task ID, making it trivial to enumerate and sort runs.
Global size-based eviction adds significant complexity (cross-task coordination, size tracking)
with marginal benefit for v1.

**Flow**:

1. After `CacheManager.writeRunMetadata()`, call `CacheManager.evict(taskId, maxEntries)`
2. Evict reads `tasks/{taskId}/runs/` directory
3. For each run, reads `metadata.json` to get timestamp
4. Sorts by timestamp descending
5. Deletes directories beyond the limit (oldest first)
6. Never deletes the entry pointed to by `latest`

**Configuration**:

- Global default via `configure({ maxCacheEntries: 5 })`
- Per-task override via `.config({ maxCacheEntries: 3 })`
- CLI flag not needed (rarely changed at runtime)

**Alternatives considered**:

- TTL-based: harder to reason about, timestamps may drift in CI
- Global size cap: cross-task coordination, need to track sizes, much more complex
- No eviction (status quo): disk grows unbounded (#442)

## R4: Atomic Metadata Writes

**Decision**: Write-then-rename pattern for all metadata.json files.

**Rationale**: `fs.rename()` is atomic on POSIX and atomic on Windows NTFS for same-volume
renames. Writing to a temp file first prevents corruption from interrupted writes (kill -9,
power loss, CI timeout). The cache directory is always on the same volume as the temp file.

**Flow**:

1. Write content to `{path}.tmp` (random suffix optional but not required — one writer per task)
2. `Fs.rename("{path}.tmp", "{path}")`
3. On error, attempt cleanup of `.tmp` file

**Alternatives considered**:

- fs.writeFile with `{ flag: 'wx' }`: doesn't prevent partial writes
- Database (SQLite): violates principle III (Lightweight and Focused), adds dependency
- Lock files: complex, deadlock-prone in worker threads

## R5: File I/O Concurrency Limits

**Decision**: Implement a simple inline semaphore (promise pool) with concurrency limit of 64.
No external dependency.

**Rationale**: Constitution principle III requires bundle < 140 KB. Adding `p-limit` or
`p-queue` increases bundle size. A 10-line semaphore implementation is trivial and sufficient.
The limit of 64 is well below typical OS limits (1024 on macOS, 65536 on Linux) while allowing
high throughput.

**Implementation sketch**:

```
async function withConcurrencyLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>)
```

Applied to `saveOutputs()` and `restoreOutputs()` in CacheManager.

**Alternatives considered**:

- p-limit: external dependency, size budget concern
- Unbounded Promise.all (status quo): EMFILE risk for large output sets
- Sequential: too slow for typical workloads

## R6: Input Fingerprint Deduplication

**Decision**: Collect all file paths from all declarations first, deduplicate, then hash once.

**Rationale**: Currently `FileFingerprints.compute()` iterates declarations with a for-loop,
resolving and hashing each declaration's files independently. If a file matches multiple
declarations, it's hashed multiple times. Collecting paths first and deduplicating via a Set
eliminates redundant I/O.

**Flow**:

1. Resolve all declarations concurrently via `Promise.all(declarations.map(d => Declaration.resolve(d, workingDir)))`
2. Flatten results into a single array
3. Deduplicate via `[...new Set(allPaths)]`
4. Hash all unique files concurrently via `Promise.all()`
5. Add additional config files (already deduplicated by nature)

**Alternatives considered**:

- In-memory hash cache across declarations: more complex, same result
- Keep sequential (status quo): slower for multi-declaration tasks

## R7: Corruption Recovery Strategy

**Decision**: Wrap all JSON.parse calls in try-catch, treating parse errors as cache miss.
Wrap restore-from-cache file operations in try-catch, falling back to re-execution on any
filesystem error.

**Rationale**: The current code already handles ENOENT via `isFileNotFoundError()`. Extending
this to catch JSON parse errors and partial restore failures follows the same pattern.
The user is warned via logger so they know the cache was corrupted.

**Error categories**:

- Invalid JSON in metadata: catch SyntaxError → warn + cache miss
- Missing run directory (latest points to deleted run): ENOENT → warn + cache miss
- Partial output files during restore: catch copy error → warn + re-execute
- Missing outputs directory: ENOENT during readdir → warn + re-execute

**Alternatives considered**:

- Checksum on metadata files: overkill for JSON files that are < 1 KB
- Automatic cache rebuild: complex, no clear benefit over re-execution
