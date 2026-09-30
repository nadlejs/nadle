# Plugin System Implementation Plan (core: P1–P3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an npm package contribute task types, lifecycle hooks (`beforeAll`/`afterAll`/`beforeTask`/`afterTask`), and custom reporters to a nadle build, applied explicitly via `use(plugin, options?)` in `nadle.config.ts`.

**Architecture:** A plugin is a plain object (`definePlugin` identity helper). `use()` records it in a new `PluginRegistry` reached through the config-load context (`NadleInstance`), registering its task types through the existing `tasks.register().config()` path. Lifecycle hooks run **main-thread only**, dispatched by an internal `PluginListener` that implements the existing `Listener` interface (mapping nadle's events → hooks). Custom reporters register a `Listener` factory selected by name. No worker/event-emitter/`WorkerParams` changes.

**Tech Stack:** TypeScript (strict, ESM, node22), vitest (unit + integration via spawned CLI), tsgo (typecheck), tsup (bundle). Spec: `docs/superpowers/specs/2026-06-13-plugin-system-design.md`.

**Conventions (match existing code):**
- Node imports PascalCase default only (`import Path from "node:path"`).
- No `process.cwd()` in core. No direct `consola` — use the `logger` abstraction.
- Source files ≤200 lines, ≤50 lines/function, ≤3 params, complexity ≤10.
- Tests integration-first (spawn CLI via `execa`); unit tests for pure logic.
- After adding any public export, regenerate `packages/nadle/index.api.md` from `build/api/index.api.md`.
- Build before integration tests: `nadle bundle --no-cache` (they spawn `packages/nadle/lib`).
- Run check before commit: `nadle check`. Expect eslint `--fix` (perfectionist sort) + prettier round-trips.
- Commit co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File structure

| File | Responsibility |
| ---- | -------------- |
| `packages/nadle/src/core/plugins/plugin.ts` | Public types (`NadlePlugin`, `PluginHooks`, hook-context types, `PluginReporter`) + `definePlugin`. |
| `packages/nadle/src/core/plugins/plugin-registry.ts` | Internal `PluginRegistry`: store applied plugins, dedup, ordered hook/reporter accessors. |
| `packages/nadle/src/core/plugins/use.ts` | Public `use()` entry: validate, dedup, register task types, record in registry. |
| `packages/nadle/src/core/plugins/plugin-listener.ts` | Internal `Listener` mapping events → hooks with catch/downgrade + enforce ordering. |
| `packages/nadle/src/core/plugins/index.ts` | Barrel: re-export the public surface. |
| `packages/nadle/src/core/nadle-context.ts` | Add `pluginRegistry` to `NadleInstance`. |
| `packages/nadle/src/core/nadle.ts` | Construct `pluginRegistry`; register `PluginListener`; (P3) registry-backed reporter selection. |
| `packages/nadle/src/core/index.ts` | Export `./plugins/index.js`. |
| `packages/nadle/src/core/options/{cli-options,types,options-resolver}.ts` | (P3) widen `reporter` to `string` + validate against registered names. |

Phases: **P1** = Tasks 1–6 (contract, registry, `use`, task types, wiring, run hooks). **P2** = Tasks 7–8 (per-task hooks). **P3** = Tasks 9–11 (custom reporters). Each task ends green + committed.

---

## Task 1: Plugin types + `definePlugin`

**Files:**
- Create: `packages/nadle/src/core/plugins/plugin.ts`
- Test: `packages/nadle/test/types/plugin.test-d.ts`

- [ ] **Step 1: Write the type-level test**

```ts
// packages/nadle/test/types/plugin.test-d.ts
import { expectTypeOf, it } from "vitest";

import { type NadlePlugin, definePlugin } from "nadle";

it("threads the Options generic into hooks", () => {
	const plugin = definePlugin<{ threshold: number }>({
		name: "timing",
		hooks: {
			beforeTask: (ctx) => {
				expectTypeOf(ctx.pluginOptions).toEqualTypeOf<{ threshold: number }>();
			}
		}
	});

	expectTypeOf(plugin).toMatchTypeOf<NadlePlugin<{ threshold: number }>>();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --project nadle plugin.test-d`
Expected: FAIL — `definePlugin`/`NadlePlugin` not exported.

- [ ] **Step 3: Implement the types + helper**

```ts
// packages/nadle/src/core/plugins/plugin.ts
import { type Logger } from "../interfaces/logger.js";
import { type Listener } from "../interfaces/listener.js";
import { type Awaitable } from "../utilities/types.js";
import { type ExecutionContext } from "../context.js";
import { type TaskConfiguration } from "../interfaces/task-configuration.js";
import { type Task, type RunnerContext } from "../interfaces/task.js";
import { type RegisteredTask } from "../interfaces/registered-task.js";
import { type Resolver } from "../utilities/types.js";

/** A task type a plugin contributes; registered as tasks.register(name, task, optionsResolver).config(config). */
export interface PluginTask {
	readonly name: string;
	readonly task: Task<never> | Task;
	readonly config?: TaskConfiguration;
	readonly optionsResolver?: Resolver;
}

/** A reporter a plugin contributes; `create` returns a Listener (like DefaultReporter). */
export interface PluginReporter {
	readonly name: string;
	readonly create: (context: ExecutionContext) => Listener;
}

/** Context shared by run-level hooks (beforeAll/afterAll). */
export interface RunHookContext<Options> {
	readonly logger: Logger;
	readonly pluginOptions: Options;
	readonly tasks: readonly RegisteredTask[];
	readonly outcome?: "success" | "failed";
	readonly error?: unknown;
}

/** Context shared by task-level hooks (beforeTask/afterTask). */
export interface TaskHookContext<Options> {
	readonly logger: Logger;
	readonly pluginOptions: Options;
	readonly task: RegisteredTask;
	readonly threadId?: number;
	readonly result?: "done" | "failed" | "up-to-date" | "from-cache" | "canceled";
	readonly error?: unknown;
}

/** Optional lifecycle hooks. All run on the main thread. */
export interface PluginHooks<Options> {
	readonly beforeAll?: (ctx: RunHookContext<Options>) => Awaitable<void>;
	readonly afterAll?: (ctx: RunHookContext<Options>) => Awaitable<void>;
	readonly beforeTask?: (ctx: TaskHookContext<Options>) => Awaitable<void>;
	readonly afterTask?: (ctx: TaskHookContext<Options>) => Awaitable<void>;
}

/** A nadle plugin. Applied via use(plugin, options?). */
export interface NadlePlugin<Options = void> {
	readonly name: string;
	readonly enforce?: "pre" | "post";
	readonly tasks?: readonly PluginTask[];
	readonly hooks?: PluginHooks<Options>;
	readonly reporters?: readonly PluginReporter[];
}

/** Identity helper for authoring a plugin with full type inference (mirrors defineTask). */
export function definePlugin<Options = void>(plugin: NadlePlugin<Options>): NadlePlugin<Options> {
	return plugin;
}

export type { RunnerContext };
```

- [ ] **Step 4: Export from the barrel + core index**

```ts
// packages/nadle/src/core/plugins/index.ts
export * from "./plugin.js";
```

Add to `packages/nadle/src/core/index.ts` (alongside the existing `export *` lines):

```ts
export * from "./plugins/index.js";
```

- [ ] **Step 5: Run the type test to verify it passes**

Run: `pnpm exec vitest run --project nadle plugin.test-d`
Expected: PASS.

- [ ] **Step 6: Regenerate the public API surface + commit**

```bash
nadle build
# copy build/api/index.api.md → packages/nadle/index.api.md if api-extractor flags a diff
nadle check
git add packages/nadle/src/core/plugins/plugin.ts packages/nadle/src/core/plugins/index.ts packages/nadle/src/core/index.ts packages/nadle/test/types/plugin.test-d.ts packages/nadle/index.api.md
git commit -m "feat: add definePlugin and plugin types (#641)"
```

---

## Task 2: `PluginRegistry` (store, dedup, ordering)

**Files:**
- Create: `packages/nadle/src/core/plugins/plugin-registry.ts`
- Test: `packages/nadle/test/unit/plugin-registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/nadle/test/unit/plugin-registry.test.ts
import { it, expect, describe } from "vitest";

import { PluginRegistry } from "../../src/core/plugins/plugin-registry.js";

const plugin = (name: string, enforce?: "pre" | "post") => ({ name, enforce, hooks: {} });

describe("PluginRegistry", () => {
	it("stores an applied plugin with its options", () => {
		const registry = new PluginRegistry();
		registry.apply(plugin("a"), { x: 1 });

		expect(registry.getApplied().map((entry) => entry.plugin.name)).toEqual(["a"]);
		expect(registry.getApplied()[0].options).toEqual({ x: 1 });
	});

	it("is a no-op when the same plugin is applied with deep-equal options", () => {
		const registry = new PluginRegistry();
		const p = plugin("a");
		registry.apply(p, { x: 1 });
		registry.apply(p, { x: 1 });

		expect(registry.getApplied()).toHaveLength(1);
	});

	it("throws when the same plugin name is applied with different options", () => {
		const registry = new PluginRegistry();
		registry.apply(plugin("a"), { x: 1 });

		expect(() => registry.apply(plugin("a"), { x: 2 })).toThrow(/already applied/);
	});

	it("orders plugins pre → normal → post, application order within each group", () => {
		const registry = new PluginRegistry();
		registry.apply(plugin("normal1"));
		registry.apply(plugin("post1", "post"));
		registry.apply(plugin("pre1", "pre"));
		registry.apply(plugin("normal2"));

		expect(registry.getOrdered().map((entry) => entry.plugin.name)).toEqual(["pre1", "normal1", "normal2", "post1"]);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --project nadle plugin-registry`
Expected: FAIL — `PluginRegistry` not found.

- [ ] **Step 3: Implement the registry**

```ts
// packages/nadle/src/core/plugins/plugin-registry.ts
import { stringify } from "../utilities/stringify.js";
import { ConfigurationError } from "../utilities/nadle-error.js";
import { type NadlePlugin } from "./plugin.js";

interface AppliedPlugin {
	readonly plugin: NadlePlugin<never>;
	readonly options: unknown;
}

const ENFORCE_ORDER = { pre: 0, normal: 1, post: 2 } as const;

export class PluginRegistry {
	private readonly applied = new Map<string, AppliedPlugin>();

	public apply(plugin: NadlePlugin<never>, options?: unknown): void {
		const existing = this.applied.get(plugin.name);

		if (existing) {
			if (stringify(existing.options) === stringify(options)) {
				return; // identical re-application is a no-op (supports meta-plugin + user both applying).
			}

			throw new ConfigurationError(`Plugin ${plugin.name} is already applied with different options.`);
		}

		this.applied.set(plugin.name, { plugin, options });
	}

	public getApplied(): AppliedPlugin[] {
		return [...this.applied.values()];
	}

	public getOrdered(): AppliedPlugin[] {
		// Stable sort by enforce group; insertion order is preserved within a group.
		return this.getApplied().sort((a, b) => ENFORCE_ORDER[a.plugin.enforce ?? "normal"] - ENFORCE_ORDER[b.plugin.enforce ?? "normal"]);
	}
}
```

Note: `stringify` is the existing util at `packages/nadle/src/core/utilities/stringify.ts` (used for deterministic object comparison; verify it sorts keys — if not, a structural deep-equal is required, see Task 2b).

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run --project nadle plugin-registry`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
nadle check
git add packages/nadle/src/core/plugins/plugin-registry.ts packages/nadle/test/unit/plugin-registry.test.ts
git commit -m "feat: add PluginRegistry with dedup and enforce ordering (#641)"
```

---

## Task 2b: Verify deterministic option equality

**Files:**
- Modify: `packages/nadle/src/core/plugins/plugin-registry.ts` (only if `stringify` is not key-order-stable)
- Test: extend `packages/nadle/test/unit/plugin-registry.test.ts`

- [ ] **Step 1: Add a key-order test**

```ts
it("treats key-reordered options as equal (no-op)", () => {
	const registry = new PluginRegistry();
	const p = plugin("a");
	registry.apply(p, { x: 1, y: 2 });
	registry.apply(p, { y: 2, x: 1 });

	expect(registry.getApplied()).toHaveLength(1);
});
```

- [ ] **Step 2: Run it**

Run: `pnpm exec vitest run --project nadle plugin-registry`
Expected: PASS if `stringify` sorts keys; FAIL otherwise.

- [ ] **Step 3: If it failed, switch to a structural deep-equal**

Replace the equality check in `apply` with the existing `compareObjects` util if present (`packages/nadle/src/core/utilities/compare-objects.ts` — confirm its export name), else a small recursive equal:

```ts
import { isEqual } from "../utilities/compare-objects.js"; // confirm name; tested by compare-objects.test.ts
// ...
if (isEqual(existing.options, options)) {
	return;
}
```

- [ ] **Step 4: Run + commit (only if changed)**

Run: `pnpm exec vitest run --project nadle plugin-registry`
Expected: PASS.

```bash
nadle check
git add packages/nadle/src/core/plugins/plugin-registry.ts packages/nadle/test/unit/plugin-registry.test.ts
git commit -m "test: deterministic plugin option equality (#641)"
```

---

## Task 3: Thread `pluginRegistry` through the config-load context

**Files:**
- Modify: `packages/nadle/src/core/nadle-context.ts`
- Modify: `packages/nadle/src/core/nadle.ts:23-37`

- [ ] **Step 1: Add the field to the context interface**

In `packages/nadle/src/core/nadle-context.ts`, extend `NadleInstance`:

```ts
import { type TaskRegistry } from "./registration/task-registry.js";
import { type PluginRegistry } from "./plugins/plugin-registry.js";
import { type FileOptionRegistry } from "./registration/file-option-registry.js";

interface NadleInstance {
	readonly taskRegistry: TaskRegistry;
	readonly pluginRegistry: PluginRegistry;
	readonly fileOptionRegistry: FileOptionRegistry;
}
```

- [ ] **Step 2: Construct it on Nadle**

In `packages/nadle/src/core/nadle.ts`, add the import and the field next to `taskRegistry` (line ~29):

```ts
import { PluginRegistry } from "./plugins/plugin-registry.js";
// ...
	public readonly taskRegistry = new TaskRegistry();
	public readonly pluginRegistry = new PluginRegistry();
```

(`Nadle` is passed as `this` to `runWithInstance` in both `init` and `initForWorker`, so the field is automatically visible during config load in main AND worker — no other wiring needed.)

- [ ] **Step 3: Typecheck**

Run: `nadle typecheck`
Expected: PASS (no usage yet; just the field + interface).

- [ ] **Step 4: Commit**

```bash
git add packages/nadle/src/core/nadle-context.ts packages/nadle/src/core/nadle.ts
git commit -m "feat: thread pluginRegistry through the config-load context (#641)"
```

---

## Task 4: `use()` — apply a plugin (validation + dedup + record)

**Files:**
- Create: `packages/nadle/src/core/plugins/use.ts`
- Modify: `packages/nadle/src/core/plugins/index.ts` (export `use`)
- Test: `packages/nadle/test/unit/use.test.ts`

- [ ] **Step 1: Write the failing test (drives the real registry via runWithInstance)**

```ts
// packages/nadle/test/unit/use.test.ts
import { it, expect, describe } from "vitest";

import { use } from "../../src/core/plugins/use.js";
import { runWithInstance } from "../../src/core/nadle-context.js";
import { TaskRegistry } from "../../src/core/registration/task-registry.js";
import { PluginRegistry } from "../../src/core/plugins/plugin-registry.js";

function withInstance(fn: () => void) {
	const taskRegistry = new TaskRegistry();
	const pluginRegistry = new PluginRegistry();
	taskRegistry.onConfigureWorkspace("root");
	runWithInstance({ taskRegistry, pluginRegistry, fileOptionRegistry: {} as never }, fn);

	return { taskRegistry, pluginRegistry };
}

describe("use", () => {
	it("records the plugin and its options in the registry", () => {
		const { pluginRegistry } = withInstance(() => {
			use({ name: "timing", hooks: {} }, { threshold: 5 });
		});

		expect(pluginRegistry.getApplied()).toHaveLength(1);
		expect(pluginRegistry.getApplied()[0].options).toEqual({ threshold: 5 });
	});

	it("rejects a malformed plugin (missing name)", () => {
		expect(() =>
			withInstance(() => {
				use({} as never);
			})
		).toThrow(/plugin/i);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --project nadle use.test`
Expected: FAIL — `use` not found.

- [ ] **Step 3: Implement `use` (task-type registration added in Task 5)**

```ts
// packages/nadle/src/core/plugins/use.ts
import { getCurrentInstance } from "../nadle-context.js";
import { ConfigurationError } from "../utilities/nadle-error.js";
import { type NadlePlugin } from "./plugin.js";

export function use<Options = void>(plugin: NadlePlugin<Options>, options?: Options): void {
	if (typeof plugin !== "object" || plugin === null || typeof plugin.name !== "string" || plugin.name.length === 0) {
		throw new ConfigurationError("use() expects a plugin object with a non-empty string name.");
	}

	const { pluginRegistry } = getCurrentInstance();
	pluginRegistry.apply(plugin as NadlePlugin<never>, options);
}
```

- [ ] **Step 4: Export `use` from the barrel**

In `packages/nadle/src/core/plugins/index.ts`:

```ts
export * from "./plugin.js";
export * from "./use.js";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run --project nadle use.test`
Expected: PASS.

- [ ] **Step 6: Regenerate API + commit**

```bash
nadle build   # update packages/nadle/index.api.md from build/api if api-extractor diffs
nadle check
git add packages/nadle/src/core/plugins/use.ts packages/nadle/src/core/plugins/index.ts packages/nadle/test/unit/use.test.ts packages/nadle/index.api.md
git commit -m "feat: add use() to apply a plugin during config load (#641)"
```

---

## Task 5: `use()` registers contributed task types (with full config)

**Files:**
- Modify: `packages/nadle/src/core/plugins/use.ts`
- Test: extend `packages/nadle/test/unit/use.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("registers a contributed task type with its config", () => {
	const noop = { run: () => {} };
	const { taskRegistry } = withInstance(() => {
		use({
			name: "docker",
			tasks: [{ name: "dockerBuild", task: noop, config: { group: "docker" } }]
		});
	});

	taskRegistry.configure({
		workspaces: [],
		packageManager: "pnpm",
		currentWorkspaceId: "root",
		rootWorkspace: { id: "root", label: "", relativePath: "", absolutePath: "/repo", dependencies: [], configFilePath: "/repo/nadle.config.ts", packageJson: { name: "root", version: "0.0.0" } }
	} as never);

	const [task] = taskRegistry.getTaskByName("dockerBuild");
	expect(task).toBeDefined();
	expect(task.configResolver().group).toBe("docker");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --project nadle use.test`
Expected: FAIL — task `dockerBuild` not registered.

- [ ] **Step 3: Register task types through the existing `tasks` API**

Extend `use.ts` to route each `PluginTask` through `tasks.register(...).config(...)` so contributed tasks get name validation, duplicate detection, and the full config surface:

```ts
import { tasks } from "../registration/api.js";
import { getCurrentInstance } from "../nadle-context.js";
import { ConfigurationError } from "../utilities/nadle-error.js";
import { type NadlePlugin, type PluginTask } from "./plugin.js";

export function use<Options = void>(plugin: NadlePlugin<Options>, options?: Options): void {
	if (typeof plugin !== "object" || plugin === null || typeof plugin.name !== "string" || plugin.name.length === 0) {
		throw new ConfigurationError("use() expects a plugin object with a non-empty string name.");
	}

	const { pluginRegistry } = getCurrentInstance();
	pluginRegistry.apply(plugin as NadlePlugin<never>, options);

	for (const pluginTask of plugin.tasks ?? []) {
		registerPluginTask(pluginTask);
	}
}

function registerPluginTask({ name, task, optionsResolver, config }: PluginTask): void {
	const builder = optionsResolver === undefined ? tasks.register(name, task as never) : tasks.register(name, task as never, optionsResolver);

	if (config !== undefined) {
		builder.config(config);
	}
}
```

Note: `tasks.register` overloads (`registration/api.ts:17-48`) accept `(name)`, `(name, fnTask)`, or `(name, task, optionsResolver)`. `task` here is a `Task` object (the builtin-task form), so the 3-arg overload applies; the `as never` bridges the plugin's generic to the registration API (the plugin author owns the type via `definePlugin`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run --project nadle use.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
nadle check
git add packages/nadle/src/core/plugins/use.ts packages/nadle/test/unit/use.test.ts
git commit -m "feat: use() registers plugin-contributed task types with config (#641)"
```

---

## Task 6: `PluginListener` + run hooks (`beforeAll`/`afterAll`) wired into Nadle

**Files:**
- Create: `packages/nadle/src/core/plugins/plugin-listener.ts`
- Modify: `packages/nadle/src/core/nadle.ts:39-47` (register the listener after the reporter)
- Test: `packages/nadle/test/unit/plugin-listener.test.ts` + integration `packages/nadle/test/options/plugin.test.ts`

- [ ] **Step 1: Write the failing unit test (dispatch + ordering + failure semantics)**

```ts
// packages/nadle/test/unit/plugin-listener.test.ts
import { it, expect, vi, describe } from "vitest";

import { PluginListener } from "../../src/core/plugins/plugin-listener.js";
import { PluginRegistry } from "../../src/core/plugins/plugin-registry.js";

const fakeContext = () => ({ logger: { warn: vi.fn(), error: vi.fn(), log: vi.fn(), info: vi.fn(), debug: vi.fn() }, taskRegistry: { tasks: [] } }) as never;

describe("PluginListener", () => {
	it("dispatches beforeAll in pre→normal→post order", async () => {
		const calls: string[] = [];
		const registry = new PluginRegistry();
		registry.apply({ name: "post", enforce: "post", hooks: { beforeAll: () => void calls.push("post") } });
		registry.apply({ name: "normal", hooks: { beforeAll: () => void calls.push("normal") } });
		registry.apply({ name: "pre", enforce: "pre", hooks: { beforeAll: () => void calls.push("pre") } });

		await new PluginListener(fakeContext(), registry).onExecutionStart();

		expect(calls).toEqual(["pre", "normal", "post"]);
	});

	it("lets a throwing beforeAll propagate (aborts the run)", async () => {
		const registry = new PluginRegistry();
		registry.apply({ name: "boom", hooks: { beforeAll: () => { throw new Error("nope"); } } });

		await expect(new PluginListener(fakeContext(), registry).onExecutionStart()).rejects.toThrow("nope");
	});

	it("catches a throwing afterAll and downgrades to a warning", async () => {
		const warn = vi.fn();
		const context = { logger: { warn, error: vi.fn(), log: vi.fn(), info: vi.fn(), debug: vi.fn() }, taskRegistry: { tasks: [] } } as never;
		const registry = new PluginRegistry();
		registry.apply({ name: "boom", hooks: { afterAll: () => { throw new Error("teardown"); } } });

		await expect(new PluginListener(context, registry).onExecutionFinish()).resolves.toBeUndefined();
		expect(warn).toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --project nadle plugin-listener`
Expected: FAIL — `PluginListener` not found.

- [ ] **Step 3: Implement `PluginListener` (run hooks only for now)**

```ts
// packages/nadle/src/core/plugins/plugin-listener.ts
import { type Listener } from "../interfaces/listener.js";
import { type ExecutionContext } from "../context.js";
import { type PluginRegistry } from "./plugin-registry.js";
import { type RunHookContext, type PluginHooks } from "./plugin.js";

type RunHook = "beforeAll" | "afterAll";

export class PluginListener implements Listener {
	public constructor(
		private readonly context: ExecutionContext,
		private readonly registry: PluginRegistry
	) {}

	public async onExecutionStart(): Promise<void> {
		// beforeAll is the one hook allowed to abort: do NOT catch.
		await this.dispatchRun("beforeAll", {});
	}

	public async onExecutionFinish(): Promise<void> {
		await this.dispatchRunSafe("afterAll", { outcome: "success" });
	}

	public async onExecutionFailed(error: unknown): Promise<void> {
		await this.dispatchRunSafe("afterAll", { outcome: "failed", error });
	}

	private buildContext(extra: Partial<RunHookContext<unknown>>, options: unknown): RunHookContext<unknown> {
		return { logger: this.context.logger, pluginOptions: options, tasks: this.context.taskRegistry.tasks, ...extra };
	}

	private async dispatchRun(hook: RunHook, extra: Partial<RunHookContext<unknown>>): Promise<void> {
		for (const { plugin, options } of this.registry.getOrdered()) {
			const fn = (plugin.hooks as PluginHooks<unknown> | undefined)?.[hook];
			await fn?.(this.buildContext(extra, options));
		}
	}

	private async dispatchRunSafe(hook: RunHook, extra: Partial<RunHookContext<unknown>>): Promise<void> {
		for (const { plugin, options } of this.registry.getOrdered()) {
			const fn = (plugin.hooks as PluginHooks<unknown> | undefined)?.[hook];

			try {
				await fn?.(this.buildContext(extra, options));
			} catch (error) {
				// Teardown must not turn a settled run red; surface as a warning.
				this.context.logger.warn(`Plugin ${plugin.name} ${hook} hook failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	}
}
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `pnpm exec vitest run --project nadle plugin-listener`
Expected: PASS.

- [ ] **Step 5: Register `PluginListener` in Nadle after the reporter**

In `packages/nadle/src/core/nadle.ts` `init()` (after line 43, the reporter `addListener`):

```ts
import { PluginListener } from "./plugins/plugin-listener.js";
// ...
		this.eventEmitter.addListener(this.#options.reporter === "agent" ? new AgentReporter(this) : new DefaultReporter(this));

		if (this.hasPluginHooks()) {
			this.eventEmitter.addListener(new PluginListener(this, this.pluginRegistry));
		}

		await this.eventEmitter.onInitialize();
```

Add the helper to the class:

```ts
	private hasPluginHooks(): boolean {
		return this.pluginRegistry.getApplied().some(({ plugin }) => plugin.hooks !== undefined && Object.keys(plugin.hooks).length > 0);
	}
```

- [ ] **Step 6: Write the integration test (a real in-repo plugin via config)**

Create the config fixture:

```ts
// packages/nadle/test/__configs__/plugin-basic.ts
import Fs from "node:fs/promises";

import { use, tasks, definePlugin } from "nadle";

const plugin = definePlugin({
	name: "marker",
	hooks: {
		beforeAll: async () => Fs.appendFile("hooks.log", "beforeAll\n"),
		afterAll: async () => Fs.appendFile("hooks.log", "afterAll\n")
	}
});

use(plugin);

tasks.register("hello", () => {});
```

Integration test:

```ts
// packages/nadle/test/options/plugin.test.ts
import Path from "node:path";
import Fs from "node:fs/promises";

import { it, expect, describe } from "vitest";
import { settle, fixture, readConfig, withGeneratedFixture } from "setup";

const files = fixture().packageJson("plugin-basic").configRaw(await readConfig("plugin-basic.ts")).build();

describe("plugins", () => {
	it("fires beforeAll and afterAll around a run", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec, cwd }) => {
				const result = await settle(exec`hello`);
				expect(result.exitCode).toBe(0);

				const log = await Fs.readFile(Path.join(cwd, "hooks.log"), "utf8");
				expect(log).toBe("beforeAll\nafterAll\n");
			}
		}));
});
```

- [ ] **Step 7: Build + run the integration test**

Run: `nadle bundle --no-cache && pnpm exec vitest run --project nadle options/plugin`
Expected: PASS — `hooks.log` contains `beforeAll\nafterAll`.

- [ ] **Step 8: Commit (end of P1)**

```bash
nadle check
git add packages/nadle/src/core/plugins/plugin-listener.ts packages/nadle/src/core/nadle.ts packages/nadle/test/unit/plugin-listener.test.ts packages/nadle/test/__configs__/plugin-basic.ts packages/nadle/test/options/plugin.test.ts
git commit -m "feat: dispatch beforeAll/afterAll plugin hooks via PluginListener (#641)"
```

---

## Task 7: Per-task hooks `beforeTask`/`afterTask` (P2)

**Files:**
- Modify: `packages/nadle/src/core/plugins/plugin-listener.ts`
- Test: extend `packages/nadle/test/unit/plugin-listener.test.ts`

- [ ] **Step 1: Write the failing unit test**

```ts
it("maps onTaskStart→beforeTask and the four terminal events→afterTask with a result", async () => {
	const results: string[] = [];
	const registry = new PluginRegistry();
	registry.apply({
		name: "tap",
		hooks: {
			beforeTask: (ctx) => void results.push(`before:${ctx.task.id}`),
			afterTask: (ctx) => void results.push(`after:${ctx.task.id}:${ctx.result}`)
		}
	});
	const listener = new PluginListener(fakeContext(), registry);
	const task = { id: "build", label: "build" } as never;

	await listener.onTaskStart(task, 1);
	await listener.onTaskFinish(task);
	await listener.onTaskUpToDate(task);
	await listener.onTaskRestoreFromCache(task);
	await listener.onTaskFailed(task);
	await listener.onTaskCanceled(task);

	expect(results).toEqual([
		"before:build",
		"after:build:done",
		"after:build:up-to-date",
		"after:build:from-cache",
		"after:build:failed",
		"after:build:canceled"
	]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --project nadle plugin-listener`
Expected: FAIL — the new `onTask*` methods don't exist on `PluginListener`.

- [ ] **Step 3: Add the per-task event mappings**

Add to `PluginListener` (import `TaskHookContext`, `RegisteredTask`):

```ts
import { type RegisteredTask } from "../interfaces/registered-task.js";
import { type TaskHookContext, type RunHookContext, type PluginHooks } from "./plugin.js";

type TaskResult = "done" | "failed" | "up-to-date" | "from-cache" | "canceled";

	public async onTaskStart(task: RegisteredTask, threadId: number): Promise<void> {
		await this.dispatchTaskSafe("beforeTask", task, { threadId });
	}

	public async onTaskFinish(task: RegisteredTask): Promise<void> {
		await this.dispatchTaskSafe("afterTask", task, { result: "done" });
	}

	public async onTaskFailed(task: RegisteredTask): Promise<void> {
		await this.dispatchTaskSafe("afterTask", task, { result: "failed" });
	}

	public async onTaskUpToDate(task: RegisteredTask): Promise<void> {
		await this.dispatchTaskSafe("afterTask", task, { result: "up-to-date" });
	}

	public async onTaskRestoreFromCache(task: RegisteredTask): Promise<void> {
		await this.dispatchTaskSafe("afterTask", task, { result: "from-cache" });
	}

	public async onTaskCanceled(task: RegisteredTask): Promise<void> {
		await this.dispatchTaskSafe("afterTask", task, { result: "canceled" });
	}

	private async dispatchTaskSafe(hook: "beforeTask" | "afterTask", task: RegisteredTask, extra: { threadId?: number; result?: TaskResult }): Promise<void> {
		for (const { plugin, options } of this.registry.getOrdered()) {
			const fn = (plugin.hooks as PluginHooks<unknown> | undefined)?.[hook];
			const ctx: TaskHookContext<unknown> = { logger: this.context.logger, pluginOptions: options, task, ...extra };

			try {
				await fn?.(ctx);
			} catch (error) {
				this.context.logger.warn(`Plugin ${plugin.name} ${hook} hook failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	}
```

Note: `beforeTask` is also dispatched "safe" (caught). Unlike `beforeAll`, a `beforeTask` throw must not abort the whole run mid-flight — it is downgraded to a warning, consistent with the spec's "must not crash the run mid-flight."

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `pnpm exec vitest run --project nadle plugin-listener`
Expected: PASS.

- [ ] **Step 5: Update the `hasPluginHooks` gate is already generic** — no change (it checks any hook key).

- [ ] **Step 6: Commit**

```bash
nadle check
git add packages/nadle/src/core/plugins/plugin-listener.ts packages/nadle/test/unit/plugin-listener.test.ts
git commit -m "feat: dispatch beforeTask/afterTask plugin hooks (#641)"
```

---

## Task 8: Integration test — per-task hooks observe the run (P2)

**Files:**
- Modify: `packages/nadle/test/__configs__/plugin-basic.ts` (add task hooks)
- Modify: `packages/nadle/test/options/plugin.test.ts`

- [ ] **Step 1: Extend the fixture config with task hooks**

```ts
// add to packages/nadle/test/__configs__/plugin-basic.ts inside hooks:
		beforeTask: async (ctx) => Fs.appendFile("hooks.log", `beforeTask:${ctx.task.name}\n`),
		afterTask: async (ctx) => Fs.appendFile("hooks.log", `afterTask:${ctx.task.name}:${ctx.result}\n`)
```

- [ ] **Step 2: Write the failing assertion**

```ts
it("fires beforeTask and afterTask around an executed task", () =>
	withGeneratedFixture({
		files,
		testFn: async ({ exec, cwd }) => {
			await settle(exec`hello`);
			const log = await Fs.readFile(Path.join(cwd, "hooks.log"), "utf8");

			expect(log).toContain("beforeTask:hello");
			expect(log).toContain("afterTask:hello:done");
		}
	}));
```

- [ ] **Step 3: Build + run**

Run: `nadle bundle --no-cache && pnpm exec vitest run --project nadle options/plugin`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
nadle check
git add packages/nadle/test/__configs__/plugin-basic.ts packages/nadle/test/options/plugin.test.ts
git commit -m "test: per-task plugin hooks fire around an executed task (#641)"
```

---

## Task 9: Widen `reporter` option to any registered name (P3)

**Files:**
- Modify: `packages/nadle/src/core/options/types.ts` (the `reporter` field)
- Modify: `packages/nadle/src/core/options/options-resolver.ts` (default + validation)
- Modify: `packages/nadle/src/core/options/cli-options.ts` (drop the static `choices`)
- Test: `packages/nadle/test/unit/use.test.ts` is unaffected; add resolver behavior to integration in Task 11.

- [ ] **Step 1: Widen the type**

In `types.ts`, change `reporter` from `SupportReporter` to `string` on `NadleBaseOptions` (keep `SupportReporter`/`SupportReporters` exported for back-compat). Confirm both `NadleBaseOptions.reporter` and `NadleResolvedOptions.reporter` resolve to `string`.

- [ ] **Step 2: Replace the static `choices` with runtime validation**

In `cli-options.ts` `reporter` option, remove `choices: SupportReporters` (so unknown names reach the resolver instead of yargs rejecting them with a static list). Keep `defaultDescription: "default"`.

In `options-resolver.ts`, after resolving options, validate the reporter name against the built-ins plus any plugin-registered reporter names (the resolver has access to the instance via the existing wiring — confirm; if not, validation moves to Nadle.init where `pluginRegistry` is in scope). Throw `ConfigurationError` listing available names on a miss. Place the check where `pluginRegistry` is reachable (Nadle.init is the safe spot — see Task 10).

- [ ] **Step 3: Typecheck**

Run: `nadle typecheck`
Expected: PASS.

- [ ] **Step 4: Regenerate option-dump snapshots + commit**

Per MEMORY snapshot rule (a resolved-option type change touches the dump): run each option-dump file alone with `-u`, then verify strict.

```bash
pnpm exec vitest run --project nadle options/help options/show-config options/config-key -u
CI=true pnpm exec vitest run --project nadle options builtin-tasks
nadle check
git add packages/nadle/src/core/options packages/nadle/test/__snapshots__
git commit -m "feat: widen --reporter to any registered name (#641)"
```

---

## Task 10: Registry-backed reporter selection (P3)

**Files:**
- Modify: `packages/nadle/src/core/nadle.ts:43` (selection) + add reporter registration to `PluginRegistry`
- Modify: `packages/nadle/src/core/plugins/plugin-registry.ts` (store + look up reporters)
- Modify: `packages/nadle/src/core/plugins/use.ts` (record reporters; dedup names)
- Test: `packages/nadle/test/unit/plugin-registry.test.ts`

- [ ] **Step 1: Write the failing registry test**

```ts
it("registers a reporter factory and looks it up by name", () => {
	const registry = new PluginRegistry();
	const create = () => ({}) as never;
	registry.apply({ name: "json-plugin", reporters: [{ name: "json", create }] });

	expect(registry.getReporter("json")).toBe(create);
	expect(registry.getReporter("missing")).toBeUndefined();
});

it("errors when two plugins register the same reporter name", () => {
	const registry = new PluginRegistry();
	registry.apply({ name: "a", reporters: [{ name: "json", create: () => ({}) as never }] });

	expect(() => registry.apply({ name: "b", reporters: [{ name: "json", create: () => ({}) as never }] })).toThrow(/reporter/i);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --project nadle plugin-registry`
Expected: FAIL — `getReporter` not found.

- [ ] **Step 3: Add reporter storage to `PluginRegistry`**

```ts
import { type PluginReporter } from "./plugin.js";
// field:
	private readonly reporters = new Map<string, PluginReporter["create"]>();
// inside apply(), after dedup, before storing:
		for (const reporter of plugin.reporters ?? []) {
			if (reporter.name === "default" || reporter.name === "agent" || this.reporters.has(reporter.name)) {
				throw new ConfigurationError(`Reporter name "${reporter.name}" is already registered.`);
			}

			this.reporters.set(reporter.name, reporter.create);
		}
// accessors:
	public getReporter(name: string): PluginReporter["create"] | undefined {
		return this.reporters.get(name);
	}

	public getReporterNames(): string[] {
		return [...this.reporters.keys()];
	}
```

- [ ] **Step 4: Run the registry test to verify it passes**

Run: `pnpm exec vitest run --project nadle plugin-registry`
Expected: PASS.

- [ ] **Step 5: Use the registry in Nadle's reporter selection + validate the name**

Replace the selection at `nadle.ts:43`:

```ts
		this.eventEmitter.addListener(this.resolveReporter());
		// ... PluginListener add ...

	private resolveReporter(): Listener {
		const name = this.options.reporter;

		if (name === "agent") {
			return new AgentReporter(this);
		}

		if (name === "default") {
			return new DefaultReporter(this);
		}

		const factory = this.pluginRegistry.getReporter(name);

		if (factory === undefined) {
			const available = ["default", "agent", ...this.pluginRegistry.getReporterNames()].join(", ");
			throw new ConfigurationError(`Unknown reporter "${name}". Available reporters: ${available}.`);
		}

		return factory(this);
	}
```

Add the `Listener` + `ConfigurationError` imports to `nadle.ts` if not present. (`this.options` is set on line 40 before this runs.)

- [ ] **Step 6: Record reporters in `use` (already handled in registry.apply) — verify `use` passes `plugin.reporters` through.** No change needed: `apply` reads `plugin.reporters`. Confirm by re-running `use.test`.

Run: `pnpm exec vitest run --project nadle use.test plugin-registry`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
nadle check
git add packages/nadle/src/core/plugins/plugin-registry.ts packages/nadle/src/core/nadle.ts packages/nadle/test/unit/plugin-registry.test.ts
git commit -m "feat: select plugin-contributed reporters by name (#641)"
```

---

## Task 11: Integration test — custom reporter (P3) + docs

**Files:**
- Create: `packages/nadle/test/__configs__/plugin-reporter.ts`
- Create: `packages/nadle/test/options/plugin-reporter.test.ts`
- Modify: `packages/docs/docs/config-reference.md`, `spec/09-cli.md`, `spec/CHANGELOG.md`, `spec/README.md`, `cspell.config.js` (add `definePlugin`/plugin words if flagged)

- [ ] **Step 1: Write the fixture config with a custom reporter**

```ts
// packages/nadle/test/__configs__/plugin-reporter.ts
import { use, tasks, definePlugin } from "nadle";

class JsonReporter {
	public onExecutionFinish() {
		// eslint-disable-next-line no-console -- test reporter
		console.log("JSON_REPORTER_ACTIVE");
	}
}

use(definePlugin({ name: "json-plugin", reporters: [{ name: "json", create: () => new JsonReporter() }] }));

tasks.register("hello", () => {});
```

- [ ] **Step 2: Write the failing integration test**

```ts
// packages/nadle/test/options/plugin-reporter.test.ts
import { it, expect, describe } from "vitest";
import { settle, fixture, getStderr, readConfig, withGeneratedFixture } from "setup";

const files = fixture().packageJson("plugin-reporter").configRaw(await readConfig("plugin-reporter.ts")).build();

describe("plugin reporter", () => {
	it("selects a plugin-contributed reporter by name", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`hello --reporter json`);
				expect(result.stdout).toContain("JSON_REPORTER_ACTIVE");
			}
		}));

	it("errors with the available reporters on an unknown name", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stderr = await getStderr(exec`hello --reporter nope`);
				expect(stderr).toContain("Unknown reporter");
				expect(stderr).toContain("json");
			}
		}));
});
```

- [ ] **Step 3: Build + run**

Run: `nadle bundle --no-cache && pnpm exec vitest run --project nadle options/plugin-reporter`
Expected: PASS.

- [ ] **Step 4: Docs + spec**

- `packages/docs/docs/config-reference.md`: add a "Plugins" section documenting `definePlugin`, `use(plugin, options?)`, the four hooks (+ the beforeTask/afterTask cache-hit asymmetry), and custom reporters.
- `spec/09-cli.md`: note that `--reporter` accepts any registered reporter name (built-in + plugin), not a closed set.
- `spec/CHANGELOG.md`: add a minor entry "Plugin system: definePlugin/use, lifecycle hooks, plugin-contributed task types and reporters." Bump `spec/README.md` version (minor).
- `cspell.config.js`: add any flagged words (`definePlugin` is camelCase so likely fine; add `pluginOptions` etc. only if cspell complains during `nadle check`).

- [ ] **Step 5: Regenerate help snapshot (new docs do not change it, but `--reporter` help text might) + full strict run**

Run: `CI=true pnpm exec vitest run --project nadle`
Expected: PASS (1100+ tests). Regenerate `options/help` with `-u` only if the `--reporter` description changed.

- [ ] **Step 6: Regenerate API + commit (end of P3)**

```bash
nadle build
# update packages/nadle/index.api.md if api-extractor diffs
nadle check
git add packages/nadle/test/__configs__/plugin-reporter.ts packages/nadle/test/options/plugin-reporter.test.ts packages/docs spec cspell.config.js packages/nadle/index.api.md packages/nadle/test/__snapshots__
git commit -m "feat: document plugin system and test custom reporters (#641)"
```

---

## Self-review notes (for the implementer)

- **Spec coverage**: Task 1 = contract/types; Tasks 2–2b = registry/dedup/ordering; Tasks 3–5 = wiring + `use` + task types; Task 6 = run hooks; Tasks 7–8 = per-task hooks; Tasks 9–11 = reporters + docs. The spec's `beforeAll`-aborts / `afterAll`-downgrades / cache-hit asymmetry / `canceled` outcome are all covered (Task 6 step 1, Task 7 step 1/3).
- **Out of scope (do NOT implement here)**: worker-process hooks, auto-discovery (separate sub-spec `2026-06-13-plugin-auto-discovery-design.md`), plugin-to-plugin deps, mutating another task's config.
- **`as never` casts** in `use.ts`/registry bridge the per-plugin `Options` generic to the type-erased registry; the plugin author owns the type via `definePlugin<Options>`. Keep them localized; do not leak `never` into public types.
- **Verify before relying on**: `stringify` key-order stability (Task 2b decides); `compare-objects` export name; that `OptionsResolver` either reaches `pluginRegistry` or validation moves to `Nadle.init` (Task 9 step 2 / Task 10 step 5 — prefer validating in `resolveReporter`, where `pluginRegistry` is definitely in scope).
- **Each task ends green + committed.** Run `nadle check` before every commit; expect perfectionist `--fix` restage round-trips.
