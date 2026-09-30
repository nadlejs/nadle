# Task Registration API Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `tasks.register(name, task, resolver).config(cfg)` (3 overloads + fluent builder) with a single keyed spec object `tasks.register(name, spec)`, keeping `register(name)` / `register(name, fn)` shorthands, allowing a spec thunk for lazy config, and removing `.config()`.

**Architecture:** `TaskSpec<Options> = TaskConfiguration & { run?, options?: Resolver<Options> }` (conditional: `run`/`options` required iff `Options` has required fields). `register`'s second arg is `TaskSpec | (() => TaskSpec)`. The internal `TaskRegistry` storage and `RegisteredTask` shape are UNCHANGED — only the public surface and its consumers change. Five subsystems consume the call shape (core, eslint-plugin AST matchers, language-server analyzer, create-nadle generator, ~70 configs/fixtures); all migrate in this change set. A codemod handles the mechanical config migrations.

**Tech Stack:** TypeScript (strict, ESM), vitest, ts-morph (codemod + language-server), `@typescript-eslint` AST utils, tsgo/tsup build.

**Order rationale:** Core first (TDD the new API + keep old paths green via the spec), then plugin transform, then migrate all in-repo configs/fixtures (so the suite stays runnable), then eslint-plugin + language-server (their tests use the new fixtures), then create-nadle, then docs + spec + api.md. Build before integration tests (they spawn `packages/nadle/lib`).

**Spec:** `docs/superpowers/specs/2026-06-14-task-registration-api-design.md`

---

## File Structure

**Core (`packages/nadle/src/core/`):**
- `registration/api.ts` — MAJOR: new `TaskSpec`/`SpecArg` types, rewritten `register` (2 shorthands + keyed), `TaskConfigurationBuilder` deleted, `computeTaskInfo` retargeted.
- `registration/define-task.ts` — ADD `defineSpec` helper.
- `plugins/use.ts` — transform `PluginTask` → keyed spec at registration.
- `plugins/plugin.ts` — doc comment only.

**eslint-plugin (`packages/eslint-plugin/src/`):**
- `utils/ast-helpers.ts` — `getConfigObject`→`getSpecObject`; `isInTaskAction`/`isTaskActionFunction` handle `spec.run`.
- `rules/valid-depends-on.ts`, `no-circular-dependencies.ts`, `require-task-description.ts`, `require-task-inputs.ts`, `padding-between-tasks.ts` — repoint to spec arg.

**language-server (`packages/language-server/src/`):**
- `analyzer.ts` — drop `findConfigCall`/`extractConfig`; rewrite `determineForm`/`extractRegistration` to read the spec object.

**create-nadle (`packages/create-nadle/src/`):**
- `generate.ts` — emit keyed spec.

**Codemod (new, `packages/nadle/scripts/`):**
- `codemod-register-api.ts` — ts-morph transform for `register(...).config(...)` → keyed spec.

**Migrated consumers:** 6 real `nadle.config.ts`, ~21 fixture configs, `test/__configs__/*`, `test/__setup__/config-builder.ts` (manual), type-tests, 13 docs pages.

---

## Task 1: Add `TaskSpec` / `SpecArg` types + `defineSpec` (no behavior change yet)

**Files:**
- Modify: `packages/nadle/src/core/registration/api.ts`
- Modify: `packages/nadle/src/core/registration/define-task.ts`
- Test: `packages/nadle/test/types/register.test-d.ts`

- [ ] **Step 1: Add the types to `api.ts`** (above the `TasksAPI` interface, after the imports). Do not wire them into `register` yet.

```ts
import type { Callback, Resolver, Awaitable } from "../utilities/types.js";
import type { TaskConfiguration } from "../interfaces/task-configuration.js";
import type { Task, RunnerContext } from "../interfaces/task.js";

export type TaskFn = Callback<Awaitable<void>, { context: RunnerContext }>;

/**
 * A task registration spec. `run`/`options` are required when the task body's
 * `Options` has required fields, optional otherwise. Config fields
 * (group, dependsOn, …) come from TaskConfiguration and sit directly on the spec.
 * `run` and `options` are reserved keys and must never be added to TaskConfiguration.
 */
export type TaskSpec<Options = void> = TaskConfiguration &
	({} extends Options
		? { run?: TaskFn | Task<Options>; options?: Resolver<Options> }
		: { run: Task<Options>; options: Resolver<Options> });

/** The spec argument to `register`: an eager spec or a thunk returning one. */
export type SpecArg<Options = void> = TaskSpec<Options> | (() => TaskSpec<Options>);
```

- [ ] **Step 2: Add `defineSpec` to `define-task.ts`** (below `defineTask`):

```ts
import { type TaskSpec } from "./api.js";

/**
 * Identity helper for authoring a task spec with full type inference
 * (mirrors `defineTask`). Useful for programmatic/spread registration.
 */
export function defineSpec<Options = void>(spec: TaskSpec<Options>): TaskSpec<Options> {
	return spec;
}
```

- [ ] **Step 3: Write type-level tests** in `register.test-d.ts` (append; do not remove existing yet):

```ts
import { expectTypeOf } from "vitest";
import { defineSpec, type TaskSpec } from "nadle";

// no-required-options body → run/options optional
expectTypeOf<TaskSpec<void>>().toMatchTypeOf<{ run?: unknown }>();
// required-options body → options required (omitting is a type error)
type WithReq = TaskSpec<{ command: string }>;
expectTypeOf<WithReq>().toHaveProperty("options");
// defineSpec returns the spec type
expectTypeOf(defineSpec({ group: "x" })).toMatchTypeOf<TaskSpec<void>>();
```

- [ ] **Step 4: Build + run the type tests**

Run: `pnpm nadle bundle` then `pnpm exec vitest run --project nadle register.test-d`
Expected: PASS (types compile; `defineSpec`/`TaskSpec` resolve).

- [ ] **Step 5: Commit**

```bash
git add packages/nadle/src/core/registration/api.ts packages/nadle/src/core/registration/define-task.ts packages/nadle/test/types/register.test-d.ts
git commit -m "feat: add TaskSpec/SpecArg types and defineSpec helper"
```

---

## Task 2: Rewrite `register` to the keyed spec + shorthands; remove `.config()`

**Files:**
- Modify: `packages/nadle/src/core/registration/api.ts:17-122`
- Test: `packages/nadle/test/__configs__/basic.ts`, `packages/nadle/test/basic.test.ts`

- [ ] **Step 1: Write a failing integration test** for the new keyed form. Add to `packages/nadle/test/__configs__/basic.ts` a keyed-spec task (this config is loaded by `basic.test.ts`):

```ts
tasks.register("keyed", {
	run: () => console.log("keyed ran"),
	group: "New",
	description: "keyed-spec task",
});
```

And in `packages/nadle/test/basic.test.ts`, add:

```ts
it("runs a keyed-spec task", async () => {
	const { stdout } = await runNadle(["keyed"]);
	expect(stdout).toContain("keyed ran");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm nadle bundle` then `pnpm exec vitest run --project nadle basic -t "keyed-spec"`
Expected: FAIL — `register` does not yet accept a keyed object (type error / runtime treats object as a `Task`).

- [ ] **Step 3: Rewrite `TasksAPI` + `register` + drop the builder** in `api.ts`. Replace the `TasksAPI` interface, the `TaskConfigurationBuilder` interface, and the `tasks` implementation with:

```ts
export interface TasksAPI {
	/** Register a placeholder/aggregator task (name only). */
	register(name: string): void;
	/** Register a task with an inline function body. */
	register(name: string, fn: TaskFn): void;
	/** Register a task from a keyed spec (or a thunk returning one). */
	register<Options>(name: string, spec: SpecArg<Options>): void;
}

export const tasks: TasksAPI = {
	register: (name: string, second?: TaskFn | SpecArg<unknown>): void => {
		const { taskRegistry } = getCurrentInstance();

		validateTaskName(name);

		if (taskRegistry.hasTaskName(name)) {
			throw new ConfigurationError(Messages.DuplicatedTaskName(name, taskRegistry.workspaceId ?? ""));
		}

		// Normalize the second argument to { run, options, config }.
		// - undefined            → placeholder
		// - function             → inline fn body (shorthand)
		// - object               → eager spec
		// - () => object          → spec thunk (resolved lazily, memoized below)
		let resolved: { run?: TaskFn | Task; options?: Resolver; config: TaskConfiguration } | undefined;

		const resolveSpec = () => {
			if (resolved !== undefined) {
				return resolved;
			}

			if (second === undefined) {
				resolved = { config: {} };
			} else if (typeof second === "function" && !isSpecThunk(second)) {
				// Inline fn body. (A spec thunk is also a function; disambiguate below.)
				resolved = { run: second as TaskFn, config: {} };
			} else {
				const spec = typeof second === "function" ? (second as () => TaskSpec)() : (second as TaskSpec);
				const { run, options, ...config } = spec;
				resolved = { run, options, config };
			}

			return resolved;
		};

		taskRegistry.register({
			name,
			configResolver: () => validateConfig(name, resolveSpec().config),
			...computeTaskInfo(resolveSpec().run, resolveSpec().options)
		});
	}
};
```

NOTE on the fn-vs-thunk ambiguity: an inline body `() => void` and a spec thunk `() => TaskSpec` are both functions. Resolve by **calling the function once and inspecting the return**: a spec thunk returns an object; an inline body returns `undefined`/a promise. Implement `isSpecThunk` accordingly, OR (simpler, chosen) make `computeTaskInfo` treat the second-arg function as the body and require spec-thunks to be wrapped — see Step 3a.

- [ ] **Step 3a: Resolve the fn/thunk ambiguity concretely.** A bare `() => ({...})` is indistinguishable from a body at the type level. Decision: **the spec-thunk form is only entered when the function's call result is a non-null object AND `second` is not also being used as a body**. Since calling a body for its return value is unsafe (bodies have side effects), instead **require the keyed-spec or eager forms for lazy config** and drop the bare top-level thunk from the public overloads — represent lazy via `options: Resolver` (already supported) plus a thunk only on the keyed path. Update `SpecArg` usage: `register(name, fn)` = body; `register(name, object)` = eager spec; lazy whole-config = `register(name, { ...partial })` where any field may itself be computed. Replace Step 3's `resolveSpec` with the non-calling version:

```ts
const resolveSpec = () => {
	if (resolved !== undefined) return resolved;
	if (second === undefined) {
		resolved = { config: {} };
	} else if (typeof second === "function") {
		resolved = { run: second as TaskFn, config: {} };   // inline body
	} else {
		const { run, options, ...config } = second as TaskSpec;
		resolved = { run, options, config };
	}
	return resolved;
};
```

And narrow `SpecArg` back to `TaskSpec<Options>` (drop the top-level thunk). Lazy config that "does real work" is preserved by `configResolver` memoization (it still defers `validateConfig`) and by `options: Resolver`. Update the spec doc's lazy section if this contradicts it (see Task 12). Keep `computeTaskInfo` as in Step 4.

- [ ] **Step 4: Retarget `computeTaskInfo`** — change its signature to take `(run, options)` instead of `(task, optionsResolver)`; body logic is unchanged (it already normalizes a function body, a Task with options resolver, and undefined→empty):

```ts
function computeTaskInfo(run: TaskFn | Task | undefined, options?: Resolver): Pick<RegisteredTask, "run" | "optionsResolver" | "empty"> {
	if (run === undefined) {
		return { empty: true, run: () => {}, optionsResolver: undefined };
	}
	if (typeof run === "function") {
		return { run, empty: false, optionsResolver: undefined };
	}
	return { ...run, empty: false, optionsResolver: options ?? (() => ({})) };
}
```

- [ ] **Step 5: Memoize the spec resolution** so `resolveSpec()` (called 3× in the registry call) runs once — it already early-returns on `resolved`. Confirm `computeTaskInfo` is called with the memoized result by hoisting: `const info = resolveSpec(); taskRegistry.register({ name, configResolver: () => validateConfig(name, info.config), ...computeTaskInfo(info.run, info.options) });`. (The `configResolver` thunk preserves #675 lazy validation.)

- [ ] **Step 6: Build + run the new test**

Run: `pnpm nadle bundle` then `pnpm exec vitest run --project nadle basic -t "keyed-spec"`
Expected: PASS.

- [ ] **Step 7: Run the full type tests** — old `.config()` overloads are gone, so `register.test-d.ts` must no longer reference them. Remove any `.config()`-based assertions; keep the Task 1 keyed assertions.

Run: `pnpm exec vitest run --project nadle register.test-d`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/nadle/src/core/registration/api.ts packages/nadle/test/__configs__/basic.ts packages/nadle/test/basic.test.ts packages/nadle/test/types/register.test-d.ts
git commit -m "feat: keyed-spec register API, remove .config() builder"
```

---

## Task 3: Transform plugin tasks to the keyed spec

**Files:**
- Modify: `packages/nadle/src/core/plugins/use.ts:23-29`
- Modify: `packages/nadle/src/core/plugins/plugin.ts:14` (doc comment)
- Test: `packages/nadle/test/__configs__/plugin-basic.ts`, `packages/nadle/test/agent-reporter.test.ts` (or the existing plugin test that loads plugin-basic)

- [ ] **Step 1: Confirm the failing state** — `registerPluginTask` calls `tasks.register(name, task, resolver).config(config)`, which no longer exists after Task 2.

Run: `pnpm nadle bundle`
Expected: FAIL — type error in `use.ts` (`.config` not on `void`; 3-arg `register` gone).

- [ ] **Step 2: Rewrite `registerPluginTask`** in `use.ts`:

```ts
function registerPluginTask({ name, task, config, optionsResolver }: PluginTask): void {
	const spec: TaskSpec<unknown> = { ...config, run: task };
	if (optionsResolver !== undefined) {
		(spec as { options?: Resolver }).options = optionsResolver;
	}
	tasks.register(name, spec);
}
```

Add the import: `import { tasks, type TaskSpec } from "../registration/api.js";` and `import type { Resolver } from "../utilities/types.js";` (adjust to existing import style).

- [ ] **Step 3: Update the `PluginTask` doc comment** in `plugin.ts:14`:

```ts
/** A task type a plugin contributes; registered via the keyed spec `tasks.register(name, { run, options, ...config })`. */
```

- [ ] **Step 4: Build + run a plugin test**

Run: `pnpm nadle bundle` then `pnpm exec vitest run --project nadle agent-reporter`
Expected: PASS (plugin-contributed tasks still register + run).

- [ ] **Step 5: Commit**

```bash
git add packages/nadle/src/core/plugins/use.ts packages/nadle/src/core/plugins/plugin.ts
git commit -m "feat: register plugin tasks via keyed spec"
```

---

## Task 4: Write the migration codemod

**Files:**
- Create: `packages/nadle/scripts/codemod-register-api.ts`
- Test: `packages/nadle/scripts/codemod-register-api.test.ts`

- [ ] **Step 1: Write failing codemod tests** covering each form:

```ts
import { describe, it, expect } from "vitest";
import { migrateSource } from "./codemod-register-api.js";

describe("register codemod", () => {
	it("name only — unchanged", () => {
		expect(migrateSource(`tasks.register("a");`)).toBe(`tasks.register("a");`);
	});
	it("fn shorthand — unchanged", () => {
		expect(migrateSource(`tasks.register("a", () => {});`)).toBe(`tasks.register("a", () => {});`);
	});
	it("fn + config", () => {
		expect(migrateSource(`tasks.register("a", fn).config({ group: "G", dependsOn: ["b"] });`))
			.toBe(`tasks.register("a", { run: fn, group: "G", dependsOn: ["b"] });`);
	});
	it("Task + options + config", () => {
		expect(migrateSource(`tasks.register("a", PnpxTask, { command: "x" }).config({ group: "G" });`))
			.toBe(`tasks.register("a", { run: PnpxTask, options: { command: "x" }, group: "G" });`);
	});
	it("Task + options, no config", () => {
		expect(migrateSource(`tasks.register("a", PnpxTask, { command: "x" });`))
			.toBe(`tasks.register("a", { run: PnpxTask, options: { command: "x" } });`);
	});
	it(".config(callback) — wrap as Object.assign into spec", () => {
		expect(migrateSource(`tasks.register("a", T, {}).config(() => ({ env: { X: "y" } }));`))
			.toContain(`run: T`); // callback config folded; see Step 3
	});
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm exec vitest run --project nadle codemod-register-api`
Expected: FAIL — `migrateSource` not defined.

- [ ] **Step 3: Implement the codemod** using ts-morph. Find every `CallExpression` matching `tasks.register(...)` (optionally chained with `.config(...)`), and rewrite:
  - name-only / `register(name, fn)` with no `.config()` → leave unchanged.
  - `register(name, fn).config(obj)` → `register(name, { run: fn, ...obj })`.
  - `register(name, Task, opts)` (± `.config(obj)`) → `register(name, { run: Task, options: opts, ...obj })`.
  - `register(name, …).config(callback)` → since the new API has no whole-spec thunk, fold a callback config by spreading its returned object literal if statically analyzable; otherwise emit `register(name, { run: …, options: …, ...(<callback>)() })` and flag for manual review (log the file:line).
  - tuple-spread `register(...x)` → leave unchanged (resolves to `register(name, fn)` shorthand); if a `.config()` follows, the spread + config can't be merged mechanically — log file:line for manual review.

```ts
import { Project, SyntaxKind, type CallExpression } from "ts-morph";

export function migrateSource(source: string): string {
	const project = new Project({ useInMemoryFileSystem: true });
	const sf = project.createSourceFile("f.ts", source);
	// ... walk register/.config() call chains, rebuild the argument list ...
	// (full implementation: locate the register CallExpression, read positional
	//  args 2..n as run/options, read the .config() arg object, merge into one
	//  ObjectLiteralExpression, replace the whole chained expression.)
	return sf.getFullText();
}
```

(Engineer: implement the ts-morph traversal to satisfy every test in Step 1. The repo already depends on ts-morph via the language-server — reuse it. Keep this file < 200 lines.)

- [ ] **Step 4: Run codemod tests**

Run: `pnpm exec vitest run --project nadle codemod-register-api`
Expected: PASS (all forms; callback/spread cases logged for manual review).

- [ ] **Step 5: Commit**

```bash
git add packages/nadle/scripts/codemod-register-api.ts packages/nadle/scripts/codemod-register-api.test.ts
git commit -m "feat: codemod for register API migration"
```

---

## Task 5: Migrate all in-repo configs + fixtures via codemod, fix the un-codemoddable

**Files:**
- Modify: 6 real configs (`nadle.config.ts` × root, packages/nadle, packages/docs, packages/sample-app, packages/vscode-extension, packages/examples/basic)
- Modify: ~21 fixtures under `packages/nadle/test/__fixtures__/**/nadle.config.ts`
- Modify: `packages/nadle/test/__configs__/*.ts`
- Modify (manual): `packages/nadle/test/__setup__/config-builder.ts`
- Modify (verify): `packages/sample-app/create-task.ts` (tuple — should need no change)

- [ ] **Step 1: Run the codemod over every config file.** Add a one-shot runner (or invoke ts-morph over a glob). Run it on the 6 real configs + all `__fixtures__/**/nadle.config.ts` + `__configs__/*.ts`.

Run: `pnpm exec tsx packages/nadle/scripts/codemod-register-api.ts "packages/**/nadle.config.ts" "packages/nadle/test/__configs__/*.ts"`
Expected: files rewritten to keyed-spec form; any callback-config / spread-with-config sites logged.

- [ ] **Step 2: Manually fix `config-builder.ts`** — it emits source strings programmatically (not codemoddable). Rewrite `toString()` (lines 39-47) to emit the keyed form:

```ts
for (const task of this.#tasks) {
	if (task.configOptions) {
		const spec = { ...(task.action ? { run: "<<ACTION>>" } : {}), ...task.configOptions };
		// build the object literal text; splice the raw action expression where <<ACTION>> sits
		const body = task.action ? `run: ${task.action}, ` : "";
		const cfg = Object.entries(task.configOptions).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ");
		lines.push(`tasks.register("${task.name}", { ${body}${cfg} });`);
	} else if (task.action) {
		lines.push(`tasks.register("${task.name}", ${task.action});`);
	} else {
		lines.push(`tasks.register("${task.name}");`);
	}
}
```

- [ ] **Step 3: Verify `create-task.ts` tuple still works.** `createTask` returns `[name, fn]`; `register(...createTask(...))` spreads to `register(name, fn)` — the preserved shorthand. Any `.config()` chained on the spread sites in `sample-app/nadle.config.ts` were handled by Step 1's codemod (logged if not). Manually convert any logged spread+config site: `register("task-A", { run: createTask("task-A", {...})[1], dependsOn: [...] })`.

- [ ] **Step 4: Build + run the full nadle suite**

Run: `pnpm nadle bundle` then `CI=true pnpm exec vitest run --project nadle`
Expected: PASS — every migrated config loads and runs under the new API.

- [ ] **Step 5: Commit**

```bash
git add -A packages/nadle/test packages/sample-app packages/docs/nadle.config.ts packages/vscode-extension/nadle.config.ts packages/examples nadle.config.ts packages/nadle/nadle.config.ts
git commit -m "refactor: migrate all configs and fixtures to keyed-spec register"
```

---

## Task 6: Update eslint-plugin `ast-helpers.ts` (central matcher)

**Files:**
- Modify: `packages/eslint-plugin/src/utils/ast-helpers.ts:30-86`
- Test: `packages/eslint-plugin/test/rules/valid-depends-on.test.ts` (drives this indirectly; direct unit if a helper test exists)

- [ ] **Step 1: Replace `getConfigObject` with `getSpecObject`** (lines 30-46). The spec object is now the 2nd positional arg, not a `.config()` chain:

```ts
/** Returns the keyed spec object (2nd arg of `register(name, spec)`), or undefined for shorthands. */
export function getSpecObject(node: TSESTree.CallExpression): TSESTree.ObjectExpression | undefined {
	const second = node.arguments[1];
	return second?.type === AST_NODE_TYPES.ObjectExpression ? second : undefined;
}
```

- [ ] **Step 2: Update `isInTaskAction` / `isTaskActionFunction`** (lines 54-86) to recognize a body inside `spec.run`. Keep the existing `register(name, fn)` branch (2nd arg is the function); add: if 2nd arg is an ObjectExpression, the action is the value of its `run` property.

```ts
// inside the function that decides whether `node` sits in a task body:
const second = registerCall.arguments[1];
if (second?.type === AST_NODE_TYPES.ObjectExpression) {
	const runProp = second.properties.find(
		(p) => p.type === AST_NODE_TYPES.Property && p.key.type === AST_NODE_TYPES.Identifier && p.key.name === "run"
	);
	// node is in a task action iff it is within runProp.value (a function)
	return runProp !== undefined && isWithin(node, (runProp as TSESTree.Property).value);
}
// existing shorthand branch: register(name, fn) → second is the function
```

- [ ] **Step 3: Build the plugin + run a rule test that exercises both helpers**

Run: `pnpm nadle compile` then `pnpm exec vitest run --project eslint-plugin valid-depends-on`
Expected: FAIL initially if the rule still calls the deleted `getConfigObject` — fixed in Task 7. For now expect a compile error pointing at the rule, confirming the helper rename took.

- [ ] **Step 4: Commit** (helper change; rules updated next)

```bash
git add packages/eslint-plugin/src/utils/ast-helpers.ts
git commit -m "refactor: eslint ast-helpers read keyed spec object"
```

---

## Task 7: Update the 5 affected eslint rules + their fixtures

**Files:**
- Modify: `packages/eslint-plugin/src/rules/valid-depends-on.ts`, `no-circular-dependencies.ts`, `require-task-description.ts`, `require-task-inputs.ts`, `padding-between-tasks.ts`
- Modify: all 11 `packages/eslint-plugin/test/rules/*.test.ts` fixtures (rewrite example sources to keyed-spec form)

- [ ] **Step 1: Rewrite each rule to read the spec object.** Concretely:
  - `valid-depends-on.ts`: delete `isConfigCallOnRegister` helper; in the `CallExpression` handler, gate on `isTasksRegisterCall(node)`, read `getSpecObject(node)`, find `dependsOn` within it. Validation body unchanged.
  - `no-circular-dependencies.ts`: replace `getConfigObject(node)` → `getSpecObject(node)`; `extractDependsOn` unchanged.
  - `require-task-description.ts`: read `getSpecObject(node)`; if undefined (shorthand/name-only) report `missingConfig`; else require a `description` key. Update messages to drop `.config()` wording → e.g. `"Add a description to the task spec."`.
  - `require-task-inputs.ts`: read `getSpecObject(node)`; same `inputs`/`outputs` search.
  - `padding-between-tasks.ts`: simplify `isTaskRegistrationStatement` — no chain walk; `isTasksRegisterCall(expr)` directly.

- [ ] **Step 2: Rewrite every rule test fixture** to the keyed-spec form. Mechanical: `register(n, T, o).config({...})` → `register(n, { run: T, options: o, ...{...} })`; `register(n, fn).config({...})` → `register(n, { run: fn, ...{...} })`. Assertion expectations (error counts/messages) stay the same except the two reworded messages in `require-task-description`.

- [ ] **Step 3: Build + run all eslint-plugin tests**

Run: `pnpm nadle compile` then `CI=true pnpm exec vitest run --project eslint-plugin`
Expected: PASS (all 11 rules; unaffected rules — no-anonymous-tasks, valid-task-name, no-duplicate-task-names, no-process-cwd, no-sync-in-task-action — pass with rewritten fixtures via the updated `isInTaskAction`).

- [ ] **Step 4: Commit**

```bash
git add packages/eslint-plugin/src/rules packages/eslint-plugin/test/rules
git commit -m "refactor: eslint rules read keyed spec; migrate rule fixtures"
```

---

## Task 8: Update language-server analyzer + fixtures

**Files:**
- Modify: `packages/language-server/src/analyzer.ts:46-168`
- Modify: 7 `packages/language-server/test/__fixtures__/*.ts`
- Modify: `packages/language-server/test/analyzer.test.ts`, `packages/language-server/test/document-store.test.ts`

- [ ] **Step 1: Rewrite the analyzer parsing.** Remove `findConfigCall` (57-65) and `extractConfig` (91-135). Rewrite `determineForm` (137-151) and `extractRegistration` (153-168):
  - 1 arg → `"no-op"`.
  - 2 args, 2nd is a function → `"function"` (inline body).
  - 2 args, 2nd is an ObjectExpression → keyed spec: classify `"typed"` if it has a `run` property whose value is not a function (a Task), `"function"` if `run` is a function, `"no-op"` if no `run`. Extract `dependsOn`/`group`/`description`/`inputs`/`outputs` directly from the spec object's properties.
  - 2 args, 2nd is a function returning an object (thunk) — out of scope per Task 2 Step 3a (no top-level thunk); treat any non-object/non-fn 2nd arg as dynamic/skip.

- [ ] **Step 2: Rewrite all 7 fixtures** (`valid.ts`, `duplicates.ts`, `unresolved-deps.ts`, `workspace-deps.ts`, `dynamic-names.ts`, `invalid-names.ts`, `workspace-lib.ts`) to keyed-spec form, preserving what each exercises (no-op, typed, function, cross-workspace deps, dynamic names, invalid names).

- [ ] **Step 3: Update `analyzer.test.ts` + `document-store.test.ts`** — fix form-detection assertions (3-arg → keyed) and the hardcoded config strings (`SIMPLE_CONFIG`, `updatedConfig`) to keyed-spec form.

- [ ] **Step 4: Build + run language-server tests**

Run: `pnpm nadle bundle` then `CI=true pnpm exec vitest run --project language-server`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/language-server
git commit -m "refactor: language-server analyzer reads keyed spec"
```

---

## Task 9: Update create-nadle generator

**Files:**
- Modify: `packages/create-nadle/src/generate.ts:47-149`
- Test: `packages/create-nadle/test/` (existing generation tests)

- [ ] **Step 1: Rewrite the renderers** to emit keyed specs. `renderBuiltinTask` → `tasks.register("n", { run: Task, options: {...}, ...config });`. `renderInlineTask` → `tasks.register("n", { run: async () => {...}, ...config });`. `renderDefaultTask` → keyed form for both TS and non-TS bootstrap. Collapse `buildConfigChain` (115-135) into a spec-fields builder that returns `key: value` fragments merged into the single object (no `.config()`).

- [ ] **Step 2: Run create-nadle tests**

Run: `CI=true pnpm exec vitest run --project create-nadle`
Expected: PASS — generated configs contain `tasks.register(... { run: ... })`. If a test asserts the old `.config()` substring, update it to the keyed form.

- [ ] **Step 3: Commit**

```bash
git add packages/create-nadle
git commit -m "feat: create-nadle scaffolds keyed-spec register"
```

---

## Task 10: Update docs (concepts, guides, reference, snippets)

**Files:**
- Modify: `packages/docs/docs/guides/registering-task.md`, `configuring-task.md`, `executing-task.md`, `authoring-plugin.md`, `file-operation-tasks.md`
- Modify: `packages/docs/docs/concepts/task.md`
- Modify: `packages/docs/docs/getting-started/{features.md,features/editor-support.md,installation.md,quickstart-for-agents.md}`
- Modify: `packages/docs/docs/config-reference.md`
- Note: `packages/docs/docs/api/**` is generated from `index.api.md` (Task 11) — regenerated, not hand-edited.

- [ ] **Step 1: Rewrite every snippet** showing `register(...).config(...)` to the keyed-spec form across the listed pages. `registering-task.md` and `configuring-task.md` get the most change — they teach the API; document the keyed object, the two shorthands, `defineSpec`, and that `.config()` is removed.

- [ ] **Step 2: Verify docs build + links**

Run: `pnpm nadle checkLinks` then `pnpm nadle packages:docs:buildSite`
Expected: PASS (no broken anchors; site builds).

- [ ] **Step 3: Commit**

```bash
git add packages/docs/docs
git commit -m "docs: migrate task-registration snippets to keyed spec"
```

---

## Task 11: Regenerate `index.api.md` + spec/ (language-agnostic) + version bump

**Files:**
- Modify: `packages/nadle/index.api.md` (regenerated)
- Modify: `spec/` — relevant registration section, `spec/CHANGELOG.md`, `spec/README.md`
- Modify (revert if Task 2 Step 3a dropped the thunk): design doc lazy section

- [ ] **Step 1: Reconcile the design spec with the implemented lazy decision.** Task 2 Step 3a dropped the top-level spec thunk (fn/thunk ambiguity unsafe to resolve by calling). Update `docs/superpowers/specs/2026-06-14-task-registration-api-design.md`: lazy config is provided by (a) the memoized `configResolver` (deferred validation) and (b) `options: Resolver`; remove the `() => TaskSpec` whole-spec thunk claim. Update the case-6 table row and open-questions accordingly.

- [ ] **Step 2: Update `spec/` (language-agnostic).** The encoding is a language binding, but reconcile any example showing the old call shape; add a `spec/CHANGELOG.md` entry; bump `spec/README.md` version **major** (breaking). Run `pnpm nadle checkLinks`.

- [ ] **Step 3: Regenerate the API report.**

Run: `pnpm nadle build` then copy `build/api/index.api.md` → `packages/nadle/index.api.md` (per the repo's api-extractor flow).
Expected: `TaskConfigurationBuilder` gone; `TasksAPI.register` keyed; `TaskSpec`, `SpecArg`, `defineSpec` present.

- [ ] **Step 4: Commit**

```bash
git add packages/nadle/index.api.md spec docs/superpowers/specs/2026-06-14-task-registration-api-design.md
git commit -m "docs: regenerate API report, bump spec to major for keyed register"
```

---

## Task 12: Regenerate option-dump snapshots + full CI gate

**Files:**
- Modify: option-dump snapshots if any resolved option changed (none expected — this is API-only, not a CLI option), but verify.
- Verify: whole pipeline.

- [ ] **Step 1: Confirm no new resolved CLI option** was added (this change is registration-API only). If snapshots are clean, skip regen; if any drift, regenerate per the repo gotcha.

Run: `CI=true pnpm exec vitest run --project nadle options builtin-tasks`
Expected: PASS, no obsolete snapshots.

- [ ] **Step 2: Run the full check + build + test pipeline.**

Run: `pnpm nadle check build test`
Expected: PASS across spell/eslint/prettier/knip/validate/checkLinks, compile/typecheck/bundle, and all six vitest projects.

- [ ] **Step 3: Run the codemod over its own corpus as a regression** — re-run on the migrated repo; expect a no-op (idempotent).

Run: `pnpm exec tsx packages/nadle/scripts/codemod-register-api.ts "packages/**/nadle.config.ts"`
Expected: no diffs (already migrated).

- [ ] **Step 4: Final commit (if snapshots regenerated)**

```bash
git add -A
git commit -m "test: regenerate snapshots for keyed-spec register"
```

---

## Self-Review

- **Spec coverage:** primary keyed form (T1-2), shorthands (T2), `options: Resolver` (T2/T4), `defineSpec` (T1), `.config()` removal (T2), plugin convergence (T3), all 5 side-effect subsystems (T3,6,7,8,9), codemod (T4-5), spec/docs/api.md (T10-11), major version bump (T11). Lazy whole-spec thunk: **changed during planning** (T2 Step 3a) — reconciled in T11 Step 1. Plugin per-task metadata via declaration merging: documented in spec, no code task needed now (it's an extension mechanism, not a feature) — noted as future.
- **Placeholder scan:** codemod Step 3 leaves the ts-morph traversal to the engineer but pins exact input/output via the Step 1 test table — acceptable (tests are the spec). No TBDs.
- **Type consistency:** `TaskSpec`/`SpecArg`/`defineSpec`/`computeTaskInfo(run, options)`/`getSpecObject`/`isInTaskAction` names consistent across tasks.
- **Known risk:** the fn-vs-thunk ambiguity forced dropping the top-level spec thunk (T2 Step 3a). This is a deviation from the approved spec; flagged for user confirmation at execution.
