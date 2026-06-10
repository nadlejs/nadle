# CLI Argument Passthrough (`--`) Implementation Plan

> **For agent workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `nadle test -- -u` passes `-u` to the `test` task's underlying command (and to custom tasks via `context.passthroughArgs`), per the approved design in `docs/superpowers/specs/2026-06-10-cli-passthrough-args-design.md` (issue #525).

**Architecture:** Capture args after `--` via yargs `populate--`, thread them through `NadleCLIOptions` → `NadleResolvedOptions` (already serialized to workers), expose on `RunnerContext` only for explicitly requested tasks, auto-append in exec-based builtin tasks, and include them in the cache key of requested tasks.

**Tech Stack:** TypeScript ESM, yargs, vitest (integration tests spawn the built CLI via execa; **run `npx nadle build` before integration tests**).

**House rules that apply to every task:**

- Run commands as single atomic invocations (no `&&`, no pipes).
- Integration tests run against `packages/nadle/lib/`, so after any `src/` change: `npx nadle build` first, then `pnpm -F nadle test <file>`.
- Pre-commit hook runs prettier/eslint/cspell — if it fails on formatting, run `npx prettier --write <file>` and re-commit.
- Commit messages: conventional commits, lowercase subject, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` after a blank line.

---

### Task 1: Capture `--` args into options types

**Files:**

- Modify: `packages/nadle/src/cli.ts:68-70`
- Modify: `packages/nadle/src/core/options/types.ts` (NadleCLIOptions, NadleResolvedOptions)
- Modify: `packages/nadle/src/core/options/cli-options-resolver.ts:43-51`
- Modify: `packages/nadle/src/core/options/options-resolver.ts:20-34`
- Test (create): `packages/nadle/test/unit/cli-options-resolver.test.ts`

- [ ] **Step 1: Write the failing unit test**

Create `packages/nadle/test/unit/cli-options-resolver.test.ts`:

```ts
import { it, expect, describe } from "vitest";
import { CLIOptionsResolver } from "src/core/options/cli-options-resolver.js";

describe("CLIOptionsResolver", () => {
	it("captures args after -- into passthroughArgs", () => {
		const options = CLIOptionsResolver.resolve({ "--": ["-u", "--reporter", "dot"], tasks: ["test"] });

		expect(options.passthroughArgs).toEqual(["-u", "--reporter", "dot"]);
	});

	it("omits passthroughArgs when -- is absent", () => {
		const options = CLIOptionsResolver.resolve({ tasks: ["test"] });

		expect(options.passthroughArgs).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F nadle test cli-options-resolver`
Expected: FAIL — `passthroughArgs` is `undefined` in the first test (the `"--"` key is currently dropped by the dash-excluding transformer).

- [ ] **Step 3: Implement option capture**

In `packages/nadle/src/core/options/cli-options-resolver.ts`, the transformer list at line 43 currently starts with alias/dash excludes which would swallow the `"--"` key. Add a rename transform **first**:

```ts
const transformers = [
	transform("--", { transformKey: "passthroughArgs" }),
	exclude((key) => aliases.includes(key)),
	exclude((key) => key.includes(DASH)),
	exclude("$0"),
	exclude(UNDERSCORE),
	transform("config", { transformKey: "configFile" }),
	transform("cache", { transformValue: Boolean }),
	transform("exclude", { transformKey: "excludedTasks" })
];
```

(`transform` already returns `null` when the value is `undefined`, so runs without `--` produce no key.)

In `packages/nadle/src/core/options/types.ts` add to `NadleCLIOptions` (after `excludedTasks`, line ~41):

```ts
	/** Arguments after `--` on the command line, passed through to requested tasks. */
	readonly passthroughArgs?: string[];
```

`NadleResolvedOptions` extends `Required<Omit<NadleCLIOptions, ...>>` and `passthroughArgs` is not in the `Omit` list, so it becomes required (`string[]`) on resolved options automatically. No change needed there.

In `packages/nadle/src/core/options/options-resolver.ts` add the default to `defaultOptions` (line ~30, next to `excludedTasks`):

```ts
		passthroughArgs: [] as string[],
```

In `packages/nadle/src/cli.ts` add a parser configuration before `.strict()` (line ~68):

```ts
	.parserConfiguration({ "populate--": true })
	.wrap(100)
	.strict()
	.parseSync();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F nadle test cli-options-resolver`
Expected: PASS (2 tests)

- [ ] **Step 5: Type-check**

Run: `npx tsc -p packages/nadle/tsconfig.build.json --noEmit`
Expected: clean

- [ ] **Step 6: Commit**

```bash
git add packages/nadle/src/cli.ts packages/nadle/src/core/options/types.ts packages/nadle/src/core/options/cli-options-resolver.ts packages/nadle/src/core/options/options-resolver.ts packages/nadle/test/unit/cli-options-resolver.test.ts
```

```bash
git commit -m "feat: capture CLI args after -- into passthroughArgs option (#525)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Expose `passthroughArgs` on `RunnerContext` (requested tasks only)

**Files:**

- Modify: `packages/nadle/src/core/interfaces/task.ts:20-25`
- Modify: `packages/nadle/src/core/engine/worker.ts:52-66`
- Test (create): `packages/nadle/test/features/passthrough-args.test.ts`

- [ ] **Step 1: Write the failing integration tests**

Create `packages/nadle/test/features/passthrough-args.test.ts`:

```ts
import { it, expect, describe } from "vitest";
import { settle, fixture, getStdout, withGeneratedFixture } from "setup";

const echoArgs = `({ context }) => console.log("ARGS=[" + context.passthroughArgs.join(" ") + "]")`;

const files = fixture()
	.packageJson("passthrough-args")
	.configRaw(
		[
			`import { tasks } from "nadle";`,
			``,
			`tasks.register("compile", ${echoArgs});`,
			`tasks.register("build", ${echoArgs}).config({ dependsOn: ["compile"] });`,
			`tasks.register("verify", ${echoArgs});`
		].join("\n")
	)
	.build();

describe.concurrent("passthrough args", () => {
	it("passes args after -- to the requested task", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`verify -- -u --silent`);

				expect(stdout).toContain("ARGS=[-u --silent]");
			}
		}));

	it("does not pass args to dependency tasks", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build -- -u`);

				// compile (dependency) sees no args; build (requested) sees -u
				expect(stdout).toContain("ARGS=[]");
				expect(stdout).toContain("ARGS=[-u]");
			}
		}));

	it("exposes an empty array when no -- is given", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`verify`);

				expect(stdout).toContain("ARGS=[]");
			}
		}));

	it("still rejects unknown flags before --", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const { exitCode, stderr } = await settle(exec`verify --unknown-flag -- -u`);

				expect(exitCode).not.toBe(0);
				expect(stderr).toContain("unknown-flag");
			}
		}));
});
```

- [ ] **Step 2: Build, then run tests to verify they fail**

Run: `npx nadle build`
Run: `pnpm -F nadle test passthrough-args`
Expected: FAIL — `context.passthroughArgs` is `undefined` (TypeError on `.join`).

- [ ] **Step 3: Add the field to `RunnerContext`**

In `packages/nadle/src/core/interfaces/task.ts` extend the interface:

```ts
/**
 * Context object passed to task runners.
 */
export interface RunnerContext {
	/** Logger instance for reporting. */
	readonly logger: Logger;
	/** The working directory for the task. */
	readonly workingDir: string;
	/** Arguments after `--` on the CLI. Empty unless this task was explicitly requested. */
	readonly passthroughArgs: readonly string[];
}
```

- [ ] **Step 4: Populate it in the worker**

In `packages/nadle/src/core/engine/worker.ts`, `runTask` (line ~57), compute the per-task value and add it to the context literal:

```ts
const task = nadle.taskRegistry.getTaskById(taskId);
const taskConfig = task.configResolver();
const workspace = getWorkspaceById(options.project, task.workspaceId);
const workingDir = Path.resolve(workspace.absolutePath, taskConfig.workingDir ?? "");
const requested = options.tasks.some((resolvedTask) => resolvedTask.taskId === taskId);
const passthroughArgs = requested ? options.passthroughArgs : [];

const context: RunnerContext = {
	workingDir,
	passthroughArgs,
	logger: bindObject(nadle.logger, ["error", "warn", "log", "info", "debug", "getColumns"])
};
```

- [ ] **Step 5: Build and run the tests**

Run: `npx nadle build`
Run: `pnpm -F nadle test passthrough-args`
Expected: PASS (4 tests)

- [ ] **Step 6: Type-check**

Run: `npx tsc -p packages/nadle/tsconfig.build.json --noEmit`
Expected: clean

- [ ] **Step 7: Commit**

```bash
git add packages/nadle/src/core/interfaces/task.ts packages/nadle/src/core/engine/worker.ts packages/nadle/test/features/passthrough-args.test.ts
```

```bash
git commit -m "feat: expose passthroughArgs on RunnerContext for requested tasks (#525)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Append passthrough args in exec-based builtin tasks

**Files:**

- Modify: `packages/nadle/src/builtin-tasks/exec-task.ts:25`
- Modify: `packages/nadle/src/builtin-tasks/pnpm-task.ts:26`
- Modify: `packages/nadle/src/builtin-tasks/pnpx-task.ts`
- Modify: `packages/nadle/src/builtin-tasks/npm-task.ts`
- Modify: `packages/nadle/src/builtin-tasks/npx-task.ts`
- Modify: `packages/nadle/src/builtin-tasks/node-task.ts:23`
- Test (modify): `packages/nadle/test/features/passthrough-args.test.ts`

- [ ] **Step 1: Write the failing integration tests**

Append to the `describe` block in `packages/nadle/test/features/passthrough-args.test.ts` (uses a separate fixture with exec tasks; `node -e` keeps it cross-platform):

```ts
const execFiles = fixture()
	.packageJson("passthrough-args-exec")
	.configRaw(
		[
			`import { tasks, ExecTask } from "nadle";`,
			``,
			`tasks.register("echo-a", ExecTask, { command: "node", args: ["-e", "console.log('A:' + process.argv.slice(1).join(' '))"] });`,
			`tasks.register("echo-b", ExecTask, { command: "node", args: ["-e", "console.log('B:' + process.argv.slice(1).join(' '))"] });`
		].join("\n")
	)
	.build();

it("appends args to ExecTask commands", () =>
	withGeneratedFixture({
		files: execFiles,
		testFn: async ({ exec }) => {
			const stdout = await getStdout(exec`echo-a -- --flag value`);

			expect(stdout).toContain("A:--flag value");
		}
	}));

it("appends the same args to every requested task", () =>
	withGeneratedFixture({
		files: execFiles,
		testFn: async ({ exec }) => {
			const stdout = await getStdout(exec`echo-a echo-b -- --flag`);

			expect(stdout).toContain("A:--flag");
			expect(stdout).toContain("B:--flag");
		}
	}));
```

- [ ] **Step 2: Build, then run tests to verify they fail**

Run: `npx nadle build`
Run: `pnpm -F nadle test passthrough-args`
Expected: the two new tests FAIL (`A:` printed without the flag).

- [ ] **Step 3: Append `context.passthroughArgs` in each builtin**

`exec-task.ts` (line 25):

```ts
const commandArguments = [...(args == null ? [] : typeof args === "string" ? parseCommandString(args) : args), ...context.passthroughArgs];
```

`pnpm-task.ts` (line 26):

```ts
const args = [...filterArgs, ...MaybeArray.toArray(options.args), ...context.passthroughArgs];
```

`node-task.ts` (line 23):

```ts
const args = [...(options.args == null ? [] : typeof options.args === "string" ? [options.args] : options.args), ...context.passthroughArgs];
```

`pnpx-task.ts`, `npm-task.ts`, `npx-task.ts`: same pattern — read each file first; each builds an args array immediately before its `execa(...)` call; spread `...context.passthroughArgs` as the final elements of that array. Do not touch the logged message lines — the args variable is already interpolated into them, so the appended args show up in logs automatically where the log uses the final array; if a file logs from `options.args` directly, leave the log as is.

`copy-task.ts` / `delete-task.ts`: intentionally untouched.

- [ ] **Step 4: Build and run the tests**

Run: `npx nadle build`
Run: `pnpm -F nadle test passthrough-args`
Expected: PASS (6 tests)

- [ ] **Step 5: Run the builtin-task test suites to catch regressions**

Run: `pnpm -F nadle test builtin-tasks`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/nadle/src/builtin-tasks packages/nadle/test/features/passthrough-args.test.ts
```

```bash
git commit -m "feat: append passthrough args in exec-based builtin tasks (#525)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Multi-task notice

**Files:**

- Modify: `packages/nadle/src/core/utilities/messages.ts`
- Modify: `packages/nadle/src/core/handlers/execute-handler.ts:15-37`
- Test (modify): `packages/nadle/test/features/passthrough-args.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `passthrough-args.test.ts` (reuses `execFiles` from Task 3):

```ts
it("logs a notice when multiple requested tasks receive args", () =>
	withGeneratedFixture({
		files: execFiles,
		testFn: async ({ exec }) => {
			const stdout = await getStdout(exec`echo-a echo-b -- --flag`);

			expect(stdout).toContain("Passing extra arguments [--flag] to 2 tasks");
		}
	}));

it("logs no notice for a single requested task", () =>
	withGeneratedFixture({
		files: execFiles,
		testFn: async ({ exec }) => {
			const stdout = await getStdout(exec`echo-a -- --flag`);

			expect(stdout).not.toContain("Passing extra arguments");
		}
	}));
```

- [ ] **Step 2: Build, run, verify the first new test fails**

Run: `npx nadle build`
Run: `pnpm -F nadle test passthrough-args`
Expected: notice test FAILS (no such output).

- [ ] **Step 3: Implement the notice**

In `packages/nadle/src/core/utilities/messages.ts` add to the `Messages` object:

```ts
	PassthroughArgsNotice: (args: string[], taskLabels: string[]) =>
		`Passing extra arguments [${args.join(" ")}] to ${taskLabels.length} tasks: ${taskLabels.join(", ")}`,
```

In `packages/nadle/src/core/handlers/execute-handler.ts`, inside `handle()` after `chosenTasks` is final (right before `taskScheduler.init`, line ~34):

```ts
const { passthroughArgs } = this.context.options;

if (passthroughArgs.length > 0 && chosenTasks.length > 1) {
	this.context.logger.log(Messages.PassthroughArgsNotice([...passthroughArgs], chosenTasks));
}
```

- [ ] **Step 4: Build and run the tests**

Run: `npx nadle build`
Run: `pnpm -F nadle test passthrough-args`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/nadle/src/core/utilities/messages.ts packages/nadle/src/core/handlers/execute-handler.ts packages/nadle/test/features/passthrough-args.test.ts
```

```bash
git commit -m "feat: log notice when passthrough args target multiple tasks (#525)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Include passthrough args in the cache key

**Files:**

- Modify: `packages/nadle/src/core/models/cache/cache-key.ts:8-14`
- Modify: `packages/nadle/src/core/caching/cache-validator.ts:18-27` (context) and `computeCacheQuery` (line ~81)
- Modify: `packages/nadle/src/core/engine/worker.ts:69-122` (pass per-task args into the validator)
- Test (create): `packages/nadle/test/unit/cache-key.test.ts`
- Test (modify): `packages/nadle/test/features/passthrough-args.test.ts`

- [ ] **Step 1: Write the failing unit test**

Create `packages/nadle/test/unit/cache-key.test.ts`:

```ts
import { it, expect, describe } from "vitest";
import { CacheKey } from "src/core/models/cache/cache-key.js";

const base = { taskId: "build", inputsFingerprints: {} };

describe("CacheKey", () => {
	it("changes when passthrough args change", async () => {
		const without = await CacheKey.compute(base);
		const withArgs = await CacheKey.compute({ ...base, passthroughArgs: ["-u"] });

		expect(withArgs).not.toBe(without);
	});

	it("treats absent and undefined passthrough args identically", async () => {
		const absent = await CacheKey.compute(base);
		const explicit = await CacheKey.compute({ ...base, passthroughArgs: undefined });

		expect(explicit).toBe(absent);
	});
});
```

- [ ] **Step 2: Run to verify the first test fails**

Run: `pnpm -F nadle test cache-key`
Expected: first test FAILS (unknown property is accepted by `hashObject` only if typed; if TypeScript rejects the property, that is the failure — proceed).

- [ ] **Step 3: Implement key + validator changes**

`packages/nadle/src/core/models/cache/cache-key.ts` — extend `Input`:

```ts
interface Input {
	readonly env?: TaskEnv;
	readonly options?: object;
	readonly taskId: TaskIdentifier;
	readonly inputsFingerprints: FileFingerprints;
	readonly passthroughArgs?: readonly string[];
	readonly dependencyFingerprints?: Record<string, string>;
}
```

(`hashObject` hashes the whole input; `undefined` must hash the same as absent — verify by reading `src/core/utilities/hash.ts`; if it does not, normalize with a spread that omits the key when undefined.)

`packages/nadle/src/core/caching/cache-validator.ts` — add to `CacheValidatorContext`:

```ts
	readonly passthroughArgs: readonly string[];
```

and in `computeCacheQuery` (line ~87) include it only when non-empty so existing cache entries stay valid:

```ts
const cacheKey = await CacheKey.compute({
	inputsFingerprints,
	taskId: this.taskId,
	env: this.taskConfiguration.env,
	options: this.context.taskOptions,
	passthroughArgs: this.context.passthroughArgs.length > 0 ? this.context.passthroughArgs : undefined,
	dependencyFingerprints: Object.keys(this.context.dependencyFingerprints).length > 0 ? this.context.dependencyFingerprints : undefined
});
```

`packages/nadle/src/core/engine/worker.ts` — **critical:** `createCacheValidator` spreads `...nadle.options` into the context, which would leak the _global_ `passthroughArgs` into every task's cache context, including dependencies. Pass the per-task value explicitly after the spread. Add `passthroughArgs` to `CacheValidatorParams` and thread it from `runTask`:

```ts
const cacheValidator = createCacheValidator(nadle, {
	taskId,
	taskConfig,
	workingDir,
	taskOptions,
	passthroughArgs,
	dependencyFingerprints,
	workspaceId: task.workspaceId
});
```

```ts
interface CacheValidatorParams {
	taskId: string;
	workingDir: string;
	workspaceId: string;
	taskOptions: unknown;
	taskConfig: TaskConfiguration;
	passthroughArgs: readonly string[];
	dependencyFingerprints: Record<string, string>;
}
```

and in `createCacheValidator`, after the `...nadle.options` spread:

```ts
return new CacheValidator(params.taskId, params.taskConfig, {
	...nadle.options,
	configFiles,
	workingDir: params.workingDir,
	passthroughArgs: params.passthroughArgs,
	taskOptions: params.taskOptions as object | undefined,
	dependencyFingerprints: params.dependencyFingerprints,
	projectDir: nadle.options.project.rootWorkspace.absolutePath,
	maxCacheEntries: params.taskConfig.maxCacheEntries ?? nadle.options.maxCacheEntries
});
```

- [ ] **Step 4: Run the unit test**

Run: `pnpm -F nadle test cache-key`
Expected: PASS

- [ ] **Step 5: Write the failing cache integration test**

Add to `passthrough-args.test.ts`:

```ts
const cachedFiles = fixture()
	.packageJson("passthrough-args-cache")
	.file("input.txt", "content")
	.configRaw(
		[
			`import { tasks } from "nadle";`,
			``,
			`tasks.register("emit", async () => {`,
			`\tconst Fs = await import("node:fs");`,
			`\tFs.writeFileSync("out.txt", "done");`,
			`}).config({ inputs: ["input.txt"], outputs: ["out.txt"] });`
		].join("\n")
	)
	.build();

it("does not reuse the no-args cache entry when args are passed", () =>
	withGeneratedFixture({
		files: cachedFiles,
		testFn: async ({ exec }) => {
			await getStdout(exec`emit`);
			const second = await getStdout(exec`emit`);

			expect(second).toContain("UP-TO-DATE");

			const withArgs = await getStdout(exec`emit -- -u`);

			expect(withArgs).not.toContain("UP-TO-DATE");
			expect(withArgs).not.toContain("FROM-CACHE");
		}
	}));
```

Check `packages/nadle/test/caching/` first for the exact inputs/outputs declaration shape and assertion strings used there (`UP-TO-DATE` / `FROM-CACHE` appear in task status lines); mirror that style if it differs from the above.

- [ ] **Step 6: Build and run; verify it failed before the validator change, passes after**

Run: `npx nadle build`
Run: `pnpm -F nadle test passthrough-args`
Expected: PASS (all tests, including the new cache test)

- [ ] **Step 7: Run the caching suite for regressions**

Run: `pnpm -F nadle test caching`
Expected: PASS (existing cache keys unaffected because empty args map to `undefined`)

- [ ] **Step 8: Commit**

```bash
git add packages/nadle/src/core/models/cache/cache-key.ts packages/nadle/src/core/caching/cache-validator.ts packages/nadle/src/core/engine/worker.ts packages/nadle/test/unit/cache-key.test.ts packages/nadle/test/features/passthrough-args.test.ts
```

```bash
git commit -m "feat: include passthrough args in cache key for requested tasks (#525)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Dry-run annotation

**Files:**

- Modify: `packages/nadle/src/core/handlers/dry-run-handler.ts:26-34`
- Test (modify): `packages/nadle/test/features/passthrough-args.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("shows args on requested tasks in dry run", () =>
	withGeneratedFixture({
		files,
		testFn: async ({ exec }) => {
			const stdout = await getStdout(exec`build --dry-run -- -u`);

			expect(stdout).toContain("build (args: -u)");
			expect(stdout).not.toContain("compile (args:");
		}
	}));
```

- [ ] **Step 2: Build, run, verify it fails**

Run: `npx nadle build`
Run: `pnpm -F nadle test passthrough-args`
Expected: new test FAILS.

- [ ] **Step 3: Implement**

In `packages/nadle/src/core/handlers/dry-run-handler.ts`, inside the `for` loop add a requested-task suffix (`ResolvedTask` import from `../interfaces/resolved-task.js`):

```ts
const { passthroughArgs } = this.context.options;
const requestedTaskIds = new Set(this.context.options.tasks.map(ResolvedTask.getId));

for (const taskId of taskIds) {
	const label = this.context.taskRegistry.getTaskById(taskId).label;
	const implicitDeps = scheduler.getImplicitDeps(taskId);
	const argsSuffix = passthroughArgs.length > 0 && requestedTaskIds.has(taskId) ? c.dim(` (args: ${passthroughArgs.join(" ")})`) : "";
	const suffix =
		implicitDeps.length > 0 ? c.dim(` (after ${implicitDeps.map((d) => this.context.taskRegistry.getTaskById(d).label).join(", ")} — implicit)`) : "";
	this.context.logger.log(`${c.yellow(">")} Task ${c.bold(label)}${argsSuffix}${suffix}`);
}
```

Mind the 200-line/50-line-function eslint limits; if the function grows past limits, extract a `formatArgsSuffix` helper in the same file.

- [ ] **Step 4: Build and run**

Run: `npx nadle build`
Run: `pnpm -F nadle test passthrough-args`
Expected: PASS

- [ ] **Step 5: Run existing dry-run-related tests**

Run: `pnpm -F nadle test dry`
Expected: PASS (or no matching files — then skip)

- [ ] **Step 6: Commit**

```bash
git add packages/nadle/src/core/handlers/dry-run-handler.ts packages/nadle/test/features/passthrough-args.test.ts
```

```bash
git commit -m "feat: show passthrough args in dry-run execution plan (#525)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Help text example

**Files:**

- Modify: `packages/nadle/src/cli.ts:67-70`

- [ ] **Step 1: Add an example to the yargs builder**

Before `.wrap(100)`:

```ts
	.example("nadle test -- -u", "Run the test task, passing -u through to its underlying command")
```

- [ ] **Step 2: Verify manually**

Run: `npx nadle build`
Run: `node packages/nadle/lib/cli.js --help`
Expected: Examples section shows the line.

- [ ] **Step 3: Commit**

```bash
git add packages/nadle/src/cli.ts
```

```bash
git commit -m "docs: add passthrough args example to CLI help (#525)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Regenerate the public API report

`RunnerContext` is exported from `src/index.ts`; the new field changes the API surface tracked by api-extractor. Pre-commit does NOT run api-extractor — do it manually.

**Files:**

- Modify: `packages/nadle/index.api.md` (generated)

- [ ] **Step 1: Build (runs api-extractor)**

Run: `npx nadle build`
Expected: build succeeds; may warn about API report mismatch.

- [ ] **Step 2: Copy the regenerated report**

Run: `node -e "require('node:fs').copyFileSync('packages/nadle/build/api/index.api.md', 'packages/nadle/index.api.md')"`

- [ ] **Step 3: Verify the diff only adds `passthroughArgs`**

Run: `git diff packages/nadle/index.api.md`
Expected: only the `RunnerContext` member addition.

- [ ] **Step 4: Commit**

```bash
git add packages/nadle/index.api.md
```

```bash
git commit -m "chore: update api report for RunnerContext.passthroughArgs (#525)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Spec updates

**Files:**

- Modify: `spec/09-cli.md` (new section after "Glob Task Selection", before "## Flags")
- Modify: `spec/10-builtin-tasks.md`
- Modify: `spec/CHANGELOG.md`
- Modify: `spec/README.md` (minor version bump)

- [ ] **Step 1: Add "Argument Passthrough" to `spec/09-cli.md`**

Read the file first to match its voice. Insert:

```markdown
### Argument Passthrough

Arguments after the first bare `--` are not parsed as Nadle options; they are captured
verbatim and passed through to tasks.

    nadle <tasks...> [options] -- <args...>

Rules:

- Passthrough arguments are delivered only to tasks explicitly requested on the command
  line (including tasks matched by a glob pattern). Dependency tasks never receive them.
- Every requested task receives the same arguments. When more than one requested task
  will receive arguments, an informational notice is logged.
- Task runners access the arguments via the runner context (`passthroughArgs`).
  Exec-based builtin tasks append them to their underlying command.
- Passthrough arguments participate in the cache key of requested tasks; an invocation
  with arguments is never served from a cache entry produced without them. Dependency
  task cache keys are unaffected.
- Strict option parsing still applies before `--`: unknown Nadle flags remain an error.
- Dry run annotates requested tasks with the arguments they would receive.
```

- [ ] **Step 2: Update `spec/10-builtin-tasks.md`**

Read the file; add a short subsection or per-task notes stating: `ExecTask`, `PnpmTask`, `PnpxTask`, `NpmTask`, `NpxTask`, and `NodeTask` append passthrough arguments after their configured arguments; `CopyTask` and `DeleteTask` ignore them.

- [ ] **Step 3: CHANGELOG + version**

Add an entry to `spec/CHANGELOG.md` under a new minor version (check current version in `spec/README.md` first, bump minor) describing the new Argument Passthrough concept; update the version in `spec/README.md`.

- [ ] **Step 4: Commit**

```bash
git add spec/09-cli.md spec/10-builtin-tasks.md spec/CHANGELOG.md spec/README.md
```

```bash
git commit -m "docs: specify CLI argument passthrough behavior (#525)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: User-facing docs

**Files:**

- Modify: `packages/docs/docs/guides/executing-task.md`
- Possibly modify: `packages/docs/docs/config-reference.md` or API docs page documenting the runner context (locate with `rtk grep -rln "workingDir" packages/docs/docs`)

- [ ] **Step 1: Add a "Passing extra arguments" section to the executing-task guide**

Read the guide first; match its tone and example style. Cover: `nadle test -- -u`, multi-task behavior with the notice, dependency exclusion, `context.passthroughArgs` for custom tasks, builtin behavior, cache interaction (one sentence).

- [ ] **Step 2: Document `passthroughArgs` wherever `RunnerContext`/task context is documented**

Search: `rtk grep -rln "workingDir" packages/docs/docs` — add the field with the same JSDoc sentence used in the interface.

- [ ] **Step 3: Commit**

```bash
git add packages/docs
```

```bash
git commit -m "docs: document CLI argument passthrough (#525)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Full verification

- [ ] **Step 1: Full pipeline**

Run: `npx nadle check build test --summary`
Expected: RUN SUCCESSFUL — lint, build, all test projects green. (Long-running; notify via `terminal-notifier -title "Claude Code - nadle" -message "Full pipeline finished"` when done.)

- [ ] **Step 2: Glob interaction smoke test (already covered by unit/integration, verify nothing missed)**

Confirm `passthrough-args.test.ts` covers: requested task, multi-task, dependency exclusion, no-args default, strict mode, exec append, notice, cache, dry run. Add the glob case if absent:

```ts
it("passes args to every glob-matched task", () =>
	withGeneratedFixture({
		files: execFiles,
		testFn: async ({ exec }) => {
			const stdout = await getStdout(exec`echo-* -- --flag`);

			expect(stdout).toContain("A:--flag");
			expect(stdout).toContain("B:--flag");
		}
	}));
```

- [ ] **Step 3: Push and open PR**

```bash
git push -u origin feat/cli-passthrough-args
```

```bash
gh pr create --title "feat: support CLI argument passthrough to tasks via -- separator" --body "Implements #525 per docs/superpowers/specs/2026-06-10-cli-passthrough-args-design.md.

## Summary
- Capture args after \`--\` (yargs \`populate--\`), thread through options to workers
- \`RunnerContext.passthroughArgs\` — populated only for explicitly requested tasks (incl. glob matches); dependencies receive \`[]\`
- Exec-based builtins (Exec/Pnpm/Pnpx/Npm/Npx/Node) append the args; Copy/Delete ignore them
- Args participate in the cache key of requested tasks only; empty args keep existing cache entries valid
- Multi-task notice, dry-run annotation, help example, spec + docs updates

Closes #525

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

```bash
gh pr merge --auto --squash
```

---

## Self-review notes

- Spec coverage: design §1 → Task 1+7; §2 → Tasks 2, 4, 11; §3 → Tasks 1–2; §4 → Tasks 2–3, 8; §5 → Task 5; §6 → Tasks 4, 6, 7; §7 → Tasks 9–10; §8 → tests embedded per task.
- The `"--"` key would be dropped by the existing dash-excluding transformer in `cli-options-resolver.ts` — the rename transform MUST run first (Task 1 Step 3).
- `createCacheValidator` spreads `nadle.options`, which would leak global args into dependency cache contexts — explicit per-task override required (Task 5 Step 3).
- `getOrCreateNadle` constructs the worker Nadle with `tasks: []`; always read the requested set from the `runTask` `options` parameter, never `nadle.options`.
