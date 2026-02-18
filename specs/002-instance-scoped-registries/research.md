# Research: Instance-Scoped Registries

## R1: Context-Binding Mechanism for Module-Level DSL Exports

**Decision**: Use Node.js `AsyncLocalStorage` from `node:async_hooks`.

**Rationale**: `AsyncLocalStorage` propagates context through the async call chain
without passing explicit parameters. When Nadle loads a config file via `jiti`, the
config code calls `tasks.register()` — a module-level export. AsyncLocalStorage lets
`tasks.register()` resolve the current Nadle instance without changing the call
signature or the user's import pattern (`import { tasks } from "nadle"`).

**Alternatives considered**:
- **Global variable swap** (set `_currentInstance = this` before load, unset after):
  Not safe for concurrent instances (two async loads could interleave).
- **Proxy with thread-local storage**: Equivalent to AsyncLocalStorage but non-standard.
- **Pass instance as parameter to config files**: Breaks FR-005 (public API must not change).
- **Dynamic import with factory**: Would require config files to export a function
  instead of calling `tasks.register()` at the top level — breaking change.

**Bundle size impact**: Zero — `node:async_hooks` is a Node.js built-in.

---

## R2: Task Function Serialization Across Worker Threads

**Decision**: Task functions (closures) **cannot** be serialized across worker thread
boundaries. Workers must still execute config files to obtain task functions.

**Rationale**: JavaScript closures capture lexical scope, imported modules, and runtime
context. The structured clone algorithm used by `worker_threads` cannot transfer functions.
This is a fundamental language constraint, not a design choice.

**Implication for SC-004**: Workers cannot entirely avoid loading config files. However,
they CAN:
1. **Cache per worker thread**: Load configs once on the first task dispatch; reuse the
   populated registry for subsequent tasks on the same thread (tinypool reuses workers).
2. **Skip project discovery**: Pass pre-resolved `Project` data from the main thread so
   workers don't re-discover the monorepo structure.
3. **Reduce scope**: Load only the config files relevant to the target task's workspace
   rather than all workspace configs.

**Revised interpretation of SC-004**: "Worker threads no longer re-load configuration
files on every task dispatch" — configs are loaded once per worker thread, not per task.

---

## R3: Worker Initialization Caching Strategy

**Decision**: Module-level caching in `worker.ts`. A `let workerNadle: Nadle | null`
variable persists across task dispatches within the same worker thread. First dispatch
initializes; subsequent dispatches reuse.

**Rationale**: TinyPool reuses worker threads. The default export function is called
per task, but the module context persists. A module-level cache means the first task
on a worker thread pays the config-loading cost; all subsequent tasks skip it entirely.

**Alternatives considered**:
- **Worker-per-task (no caching)**: Current behavior. Unacceptable — re-loads ALL
  configs per task dispatch.
- **Pre-warm all workers at pool creation**: Would block pool startup. Tasks may never
  use all threads.
- **Main-thread RPC for task execution**: Defeats parallelism. Creates contention.

---

## R4: Impact on Public API Surface

**Decision**: No changes to the public API surface. `tasks`, `configure`, and
`defineTask` remain module-level exports with identical signatures.

**Rationale**: The change is internal. `tasks` becomes a thin proxy that delegates to
`getCurrentInstance().taskRegistry`. The user's config file code is unchanged:
```ts
import { tasks, configure } from "nadle";
tasks.register("build", async ({ context }) => { ... });
configure({ parallel: true });
```

**api-extractor impact**: The exported types (`TasksAPI`, `TaskConfigurationBuilder`,
`configure` signature) are unchanged. `index.api.md` should not change.

---

## R5: Specification Files Requiring Updates

**Decision**: Three spec files need updating after implementation.

| File | Change | Severity |
|------|--------|----------|
| `spec/01-task.md` line 8 | Remove "singleton" language — describe instance-bound behavior | Minor (wording) |
| `spec/04-execution.md` line 50 | Update worker flow — describe per-thread caching | Minor (clarification) |
| `spec/08-configuration-loading.md` | Add note about AsyncLocalStorage context during config load | Minor (new detail) |
| `spec/CHANGELOG.md` | Add entry for this change | Required |
| `spec/README.md` | Patch version bump (1.0.0 → 1.0.1) | Required |
