# Research: Skip Redundant Worker Re-Initialization

## Decision 1: Lightweight Init Method vs Bypassing Nadle Class

**Decision**: Add `Nadle.initForWorker(resolvedOptions)` method on the existing class.

**Rationale**: The worker already uses the `Nadle` interface throughout (`nadle.taskRegistry`,
`nadle.logger`, `nadle.options`). Introducing a separate lightweight worker context would
require changing all call sites in worker.ts and diverging the interface. A new method on the
existing class preserves the interface and keeps the change minimal.

**Alternatives considered**:
- **Separate WorkerContext class**: Rejected because worker.ts accesses `nadle.taskRegistry`,
  `nadle.logger`, `nadle.options` — replicating this interface creates unnecessary duplication.
- **Factory function returning a plain object**: Rejected for the same interface reasons and
  because `Nadle` already has the right field declarations.

## Decision 2: Config File Loading Strategy

**Decision**: Load config files using the workspace config file paths already available in
`NadleResolvedOptions.project` (the resolved `Project` object).

**Rationale**: The resolved `Project` contains `rootWorkspace.configFilePath` and
`workspaces[*].configFilePath` — the exact paths that `ProjectResolver` would have discovered
via filesystem walks. Using these directly skips all filesystem discovery while loading the
same files in the same order.

**Alternatives considered**:
- **Serialize task registry from main thread**: Rejected because task functions are closures
  that cannot be serialized via the structured clone algorithm. Config files must still be
  loaded to define the function bodies.
- **Skip config loading entirely**: Rejected for the same reason — task functions live in
  those config files and must be imported per thread.

## Decision 3: FileOptionRegistry in Workers

**Decision**: The `FileOptionRegistry` in workers will be populated during config loading
(since `configure()` calls in config files are still executed), but its contents are never
consumed — option merging is skipped because the worker uses resolved options directly.

**Rationale**: The `configure()` DSL function delegates to `getCurrentInstance().fileOptionRegistry`.
When a config file containing `configure()` is loaded in a worker, the call still executes and
stores options in the worker's `FileOptionRegistry`. This is harmless — the data is simply
unused. Attempting to prevent these calls would require modifying the `configure()` function
to detect worker context, adding unnecessary complexity.

**Alternatives considered**:
- **No-op FileOptionRegistry in workers**: Rejected because it would require a conditional
  branch in the `configure()` function or a subclass, adding complexity for no benefit.

## Decision 4: Spec Updates

**Decision**: Update `spec/04-execution.md` to document that workers use a lightweight
initialization path that reuses resolved options from the main thread and only loads config
files. Bump spec to 1.2.0 (minor — expanded behavioral rules for worker initialization).

**Rationale**: The spec currently says workers "initialize Nadle on first dispatch" but
doesn't specify what initialization entails. The optimization changes what "initialize" means,
so the spec should be explicit about the lightweight path.
