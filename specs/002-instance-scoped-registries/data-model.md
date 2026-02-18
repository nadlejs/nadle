# Data Model: Instance-Scoped Registries

## Entity Changes

### Nadle (modified)

Previously: Referenced global `taskRegistry` singleton.
After: Owns its own `TaskRegistry` and `FileOptionRegistry` instances.

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `taskRegistry` | `TaskRegistry` | Modified | Was `= taskRegistry` (global), becomes `= new TaskRegistry()` |
| `fileOptionRegistry` | `FileOptionRegistry` | **New** | Previously not on Nadle; was global-only |

### TaskRegistry (unchanged internally)

No changes to class internals. Only the instantiation pattern changes (from
module-level singleton to per-Nadle-instance).

| Field | Type | Description |
|-------|------|-------------|
| `registry` | `Map<TaskIdentifier, RegisteredTask>` | Finalized tasks |
| `buffer` | `Map<TaskIdentifier, BufferedTask>` | Tasks during config loading |
| `workspaceId` | `string \| null` | Current workspace context |
| `#project` | `Project \| null` | Set on `configure()` |

### FileOptionRegistry (unchanged internally)

No changes to class internals. Only instantiation changes.

| Field | Type | Description |
|-------|------|-------------|
| `registry` | `Map<string, NadleFileOptions>` | Options per workspace |
| `workspaceId` | `string \| null` | Current workspace context |

### NadleContext (new)

AsyncLocalStorage store type. Binds the active Nadle instance during config loading.

| Field | Type | Description |
|-------|------|-------------|
| `instance` | `Nadle` | The active Nadle instance |

### WorkerParams (modified)

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `taskId` | `string` | Unchanged | |
| `env` | `NodeJS.ProcessEnv` | Unchanged | |
| `options` | `NadleResolvedOptions` | Unchanged | Contains pre-resolved `project` |
| `port` | `MessagePort` | Unchanged | |

## Relationship Diagram

```
Nadle (instance)
├── owns TaskRegistry (1:1, exclusive)
├── owns FileOptionRegistry (1:1, exclusive)
├── owns TaskScheduler (1:1, existing)
├── owns ExecutionTracker (1:1, existing)
└── owns EventEmitter (1:1, existing)

AsyncLocalStorage<NadleContext>
└── binds Nadle instance during config file loading
    ├── tasks.register() → getCurrentInstance().taskRegistry
    └── configure() → getCurrentInstance().fileOptionRegistry

Worker Thread
└── owns its own Nadle instance (cached per thread)
    └── owns its own TaskRegistry + FileOptionRegistry
```

## State Transitions

No changes to task lifecycle states. The only new state concept is the
AsyncLocalStorage binding:

```
No instance → (Nadle.init() enters runWithInstance) → Instance bound
Instance bound → (config file loading) → tasks.register() succeeds
Instance bound → (config loading complete, exits runWithInstance) → No instance
No instance → tasks.register() → ERROR: "No active Nadle instance"
```

## Removed Entities

| Entity | Location | Reason |
|--------|----------|--------|
| `taskRegistry` (singleton) | `task-registry.ts:99` | Replaced by per-instance |
| `fileOptionRegistry` (singleton) | `file-option-registry.ts:34` | Replaced by per-instance |
