# Quickstart: Workspace Task Execution Improvements

**Feature**: 006-workspace-task-execution
**Branch**: `006-workspace-task-execution`

## What This Feature Does

When you run `nadle build` in a monorepo, Nadle now automatically respects workspace
dependency ordering. If `packages/app` depends on `packages/lib` in `package.json`,
`lib:build` will complete before `app:build` starts — no configuration needed.

## Before (current behavior)

```typescript
// packages/lib/nadle.config.ts
tasks.register("build", () => {
	/* build lib */
});

// packages/app/nadle.config.ts
tasks
	.register("build", () => {
		/* build app */
	})
	.config({ dependsOn: ["packages:lib:build"] }); // ← manual wiring required!
```

## After (with this feature)

```typescript
// packages/lib/nadle.config.ts
tasks.register("build", () => {
	/* build lib */
});

// packages/app/nadle.config.ts
tasks.register("build", () => {
	/* build app */
});
// No dependsOn needed! Nadle reads package.json dependencies automatically.
```

## How It Works

1. Nadle reads workspace dependencies from `package.json` (`dependencies`,
   `devDependencies`, `peerDependencies`, `optionalDependencies` with `workspace:*` protocol)
2. During scheduling, for each task, Nadle checks if upstream workspaces define a task with
   the same name
3. If yes, an implicit dependency edge is added to the DAG
4. Root tasks act as aggregation points — root `build` runs after all child `build` tasks

## Opting Out

```typescript
// nadle.config.ts (root)
configure({ implicitDependencies: false });
```

## Debugging

```bash
# See implicit dependencies in the execution plan
nadle build --dry-run

# See each implicit dependency as it's injected
nadle build --log-level debug
```

## Development: Running Tests

```bash
# Unit tests for scheduler (new DI-based tests)
pnpm -F nadle test unit/task-scheduler
pnpm -F nadle test unit/implicit-dependency-resolver

# Integration tests for implicit deps
pnpm -F nadle test features/workspaces/workspaces-implicit-deps

# All tests
pnpm -F nadle test
```

## Key Files

| File                                                        | Purpose                                   |
| ----------------------------------------------------------- | ----------------------------------------- |
| `src/core/engine/scheduler-types.ts`                        | `SchedulerDependencies` interface         |
| `src/core/engine/implicit-dependency-resolver.ts`           | Pure function: workspace deps → task deps |
| `src/core/engine/task-scheduler.ts`                         | Refactored to use `SchedulerDependencies` |
| `src/core/options/types.ts`                                 | `implicitDependencies` option added       |
| `src/core/registration/task-registry.ts`                    | Name index for O(1) lookups               |
| `test/unit/implicit-dependency-resolver.test.ts`            | Unit tests for implicit dep resolution    |
| `test/unit/task-scheduler.test.ts`                          | Rewritten with injectable deps            |
| `test/features/workspaces/workspaces-implicit-deps.test.ts` | Integration tests                         |
