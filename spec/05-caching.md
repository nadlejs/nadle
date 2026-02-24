# 05 — Caching

Nadle caches task outputs to avoid redundant work. Caching is based on input
fingerprinting and output snapshots.

## Precondition

A task is cacheable only if **both** `inputs` and `outputs` are declared in its
configuration. If either is missing, the task is always executed.

## Validation Outcomes

Cache validation produces exactly one of five results:

| Result               | Condition                                                                       | Action                                          |
| -------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------- |
| `not-cacheable`      | Task has no inputs or no outputs declared.                                      | Execute the task.                               |
| `cache-disabled`     | The `--no-cache` flag is set.                                                   | Execute the task.                               |
| `up-to-date`         | Cache key matches the latest run AND output fingerprints are unchanged on disk. | Skip execution entirely.                        |
| `restore-from-cache` | Cache key found in run history, but outputs need restoration.                   | Copy cached outputs to project, skip execution. |
| `cache-miss`         | No cache entry exists for the current cache key.                                | Execute the task, then save outputs.            |

## Validation Flow

1. Check if task is cacheable (inputs AND outputs defined). If not, return `not-cacheable`.
2. Check if caching is enabled (`cache` flag). If not, return `cache-disabled`.
3. Compute input fingerprints from config files and declared input patterns.
4. Compute cache key from `{taskId, inputsFingerprints, env}`.
5. Check if a cache entry exists for this key.
6. If no cache entry exists, return `cache-miss` with reasons.
7. Read the latest run metadata.
8. Compute current output fingerprints.
9. If the latest run's cache key matches AND output fingerprints match, return `up-to-date`.
10. Otherwise, return `restore-from-cache`.

## Input Fingerprinting

Each input file is hashed with SHA-256 to produce a hex-encoded fingerprint. The
result is a map from absolute file path to fingerprint string.

### Implicit Inputs

Config files are always included as implicit inputs:

- The root workspace config file (always present).
- The current workspace config file (if it exists and differs from the root).

This ensures cache invalidation when configuration changes.

### Declared Inputs

File declarations are resolved via glob against the working directory. Directory
declarations are expanded to include all nested files recursively.

## Cache Key Computation

The cache key is computed by hashing an object containing:

| Field                | Description                                |
| -------------------- | ------------------------------------------ |
| `taskId`             | The task identifier string.                |
| `inputsFingerprints` | Map of file path to SHA-256 hash.          |
| `env`                | The task's environment variables (if any). |

The hash is SHA-256 with unordered object and array comparison, producing a 64-character
hex string.

## Up-to-date vs Restore-from-cache

|                              | Up-to-date                | Restore-from-cache                              |
| ---------------------------- | ------------------------- | ----------------------------------------------- |
| Cache key matches latest run | Yes                       | Not necessarily (may match a non-latest run)    |
| Output files exist on disk   | Yes, with correct content | May be missing or modified                      |
| Action                       | Skip entirely             | Copy cached outputs back, update latest pointer |

## Cache Miss Reasons

When a cache miss occurs, reasons are computed by comparing the previous run's input
fingerprints with the current ones:

| Reason              | Condition                                                       |
| ------------------- | --------------------------------------------------------------- |
| `no-previous-cache` | No previous run metadata exists at all.                         |
| `input-changed`     | A file exists in both old and new, but its fingerprint differs. |
| `input-removed`     | A file existed in the old fingerprints but not in the new.      |
| `input-added`       | A file exists in the new fingerprints but not in the old.       |

Multiple reasons may be reported for a single cache miss.

## Storage Layout

Cache data is stored under the cache directory (default: `node_modules/.cache/nadle/`):

```
{cacheDir}/
  tasks/
    {encodedTaskId}/
      metadata.json                     # Latest run pointer
      runs/
        {cacheKey}/                     # 64-char hex hash
          metadata.json                 # Run metadata
          outputs/                      # Snapshot of output files
            {relative-paths}...
```

### Task ID Encoding

Task identifiers containing colons are encoded by replacing colons with underscores
for filesystem compatibility. For example, `packages:foo:build` becomes
`packages_foo_build`.

### Metadata Structures

**Task metadata** (`tasks/{id}/metadata.json`):

| Field    | Description                       |
| -------- | --------------------------------- |
| `latest` | Cache key of the most recent run. |

**Run metadata** (`tasks/{id}/runs/{key}/metadata.json`):

| Field                | Description                                       |
| -------------------- | ------------------------------------------------- |
| `version`            | Schema version (currently `1`).                   |
| `taskId`             | Task identifier string.                           |
| `cacheKey`           | Cache key for this run.                           |
| `timestamp`          | ISO 8601 timestamp of when the run was cached.    |
| `inputsFingerprints` | Map of file path to SHA-256 hash.                 |
| `outputsFingerprint` | SHA-256 hash of all output fingerprints combined. |

## Output Snapshot

### Saving

After a successful execution on cache miss:

1. Compute fingerprints for all output files.
2. For each output file, copy it from the project to the cache's `outputs/` directory,
   preserving relative paths.
3. Write run metadata.
4. Update the task's latest pointer.

### Restoring

On restore-from-cache:

1. Read all files from the cached `outputs/` directory.
2. Copy each file back to its original location in the project, creating directories
   as needed.
3. Update the task's latest pointer to the restored cache key.

## Cache Update Flow

After validation, the cache is updated based on the result:

| Result               | Update Action                                            |
| -------------------- | -------------------------------------------------------- |
| `not-cacheable`      | No action.                                               |
| `up-to-date`         | No action.                                               |
| `restore-from-cache` | Update latest run pointer.                               |
| `cache-miss`         | Save outputs, write run metadata, update latest pointer. |
| `cache-disabled`     | No action.                                               |
