# Quickstart: Fixture Builder

## Scenario 1: Configure-only fixture (worker config)

```typescript
import { config, fixture, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("workers")
	.config(config().configure({ maxWorkers: 7 }))
	.config("max-percentage", config().configure({ maxWorkers: "25%" }))
	.build();

it("should set maxWorkers from config", () =>
	withGeneratedFixture({
		files,
		testFn: async ({ cwd }) => {
			const exec = createExec({ cwd, config: "max-percentage" });
			await expect(getStdout(exec`--show-config`)).resolves.contain('"maxWorkers": 16');
		}
	}));
```

## Scenario 2: Task registration fixture (invalid names)

```typescript
const files = fixture()
	.packageJson("invalid-task-name")
	.config("colon", config().task("build:docker"))
	.config("empty", config().task(""))
	.config("underscore", config().task("build_docker"))
	.build();

it("should throw invalid task name error", () =>
	withGeneratedFixture({
		files,
		testFn: async ({ cwd }) => {
			await expect(getStderr(createExec({ cwd, config: "colon" })``)).resolves.toContain("Invalid task name: [build:docker]");
		}
	}));
```

## Scenario 3: Task with action and config

```typescript
const files = fixture()
	.packageJson("cancellation")
	.config(
		config()
			.task("fail-task", `async () => { throw new Error("expected failure"); }`)
			.task("success-task", `async () => { await new Promise(r => setTimeout(r, 3000)); }`)
			.taskWithConfig("main-task", { dependsOn: ["fail-task", "success-task"] })
	)
	.build();
```

## Scenario 4: Different module format

```typescript
const esmTs = fixture().packageJson("esm-ts", { type: "module" }).config(config().task("hello", '() => console.log("Hello from ESM TS!")')).build();

const cjsJs = fixture()
	.packageJson("cjs-js", { type: "commonjs" })
	.configRaw('const { tasks } = require("nadle");\ntasks.register("hello", () => console.log("Hello from CJS JS!"));\n', "nadle.config.js")
	.build();
```

## Scenario 5: Mixed config file precedence

```typescript
const mixed = fixture()
	.packageJson("mixed-ts-js", { type: "module" })
	.configRaw('import { tasks } from "nadle";\ntasks.register("hello-js");\n', "nadle.config.js")
	.config(config().task("hello-ts"))
	.build();
```
