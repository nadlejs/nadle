# Contract: Cache Key Computation

## Input

```typescript
interface CacheKeyInput {
	readonly taskId: string;
	readonly inputsFingerprints: Record<string, string>;
	readonly env?: Record<string, string>;
	readonly options?: object;
	readonly dependencyFingerprints?: Record<string, string>;
}
```

## Output

64-character hex SHA-256 string.

## Rules

1. All fields are hashed with unordered object/array comparison (deterministic regardless
   of key insertion order or array element order).
2. `options` is only included when the task has an `optionsResolver` configured.
3. `dependencyFingerprints` is only included when the task has cacheable dependencies that
   completed with a fingerprint. Non-cacheable dependencies are omitted.
4. Two identical inputs MUST always produce the same cache key.
5. Changing any single field MUST produce a different cache key.
