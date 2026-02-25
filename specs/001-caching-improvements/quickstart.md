# Quickstart: Caching Improvements

## What Changed

### Cache key now includes dependency outputs and task options

Previously, a task's cache key was derived from `{taskId, inputsFingerprints, env}`. Now it
also includes:

- **Dependency output fingerprints**: If task B depends on task A, A's output fingerprint is
  included in B's cache key. When A produces different outputs, B automatically re-executes.
- **Task options**: If a task uses `optionsResolver`, the resolved options are hashed into the
  cache key. Changing options invalidates the cache.

### Automatic cache eviction

The cache now automatically cleans up old entries. Each task retains at most 5 cache entries
(configurable). When a new entry is saved, the oldest entries beyond the limit are removed.

```typescript
// Global default (in nadle.config.ts)
configure({ maxCacheEntries: 10 });

// Per-task override
tasks.register("build", buildFn).config({
	inputs: [Inputs.files("src/**/*.ts")],
	outputs: [Outputs.dirs("dist")],
	maxCacheEntries: 3
});
```

### Corruption recovery

Corrupted cache metadata (invalid JSON, missing files) no longer crashes the build. The
system logs a warning and falls back to re-execution.

## Breaking Changes

- **Cache keys are different**: All existing cache entries will miss on first run after
  upgrading. This is intentional — the old cache key format didn't include enough information
  for correctness.
- **New `maxCacheEntries` option**: Defaults to 5. Old projects with many cached runs will
  see entries evicted after the first post-upgrade run.

## Verifying It Works

```bash
# Run a pipeline with dependencies — both tasks should execute
npx nadle build test

# Run again — both should be up-to-date
npx nadle build test

# Modify a source file that's an input to "build"
echo "// change" >> src/index.ts

# Run again — "build" re-executes, "test" also re-executes
# because build's output fingerprint changed
npx nadle build test
```
