# Contract: Worker Message Protocol

## Worker → Main Thread (WorkerMessage)

```typescript
type WorkerMessage =
	| { type: "start"; threadId: number }
	| { type: "up-to-date"; threadId: number; outputsFingerprint: string }
	| { type: "from-cache"; threadId: number; outputsFingerprint: string };
// "start" is followed by task execution; outputsFingerprint posted
// separately after execution + cache save completes
```

After a successful execution (cache-miss path), the worker posts:

1. `{ type: "start", threadId }` — before execution begins
2. Execution runs
3. Cache update saves outputs and computes fingerprint
4. Worker function returns; TaskPool reads the fingerprint from the cache update result

For the cache-miss path specifically, the outputsFingerprint is returned as the resolved
value of the worker function (via pool.run return value), not via MessagePort.

## Main Thread → Worker (WorkerParams)

```typescript
interface WorkerParams {
	readonly taskId: string;
	readonly port: MessagePort;
	readonly env: NodeJS.ProcessEnv;
	readonly options: NadleResolvedOptions;
	readonly dependencyFingerprints: Record<string, string>;
}
```

## Rules

1. `dependencyFingerprints` contains entries only for cacheable dependencies that completed
   successfully. Non-cacheable dependencies are absent from the map.
2. If a dependency has caching disabled (`--no-cache`), it is absent from the map. This
   causes the downstream cache key to differ from any previous run where the dependency
   was cached, resulting in a cache miss.
3. The TaskPool MUST collect fingerprints from all direct dependencies before dispatching
   a dependent task.
