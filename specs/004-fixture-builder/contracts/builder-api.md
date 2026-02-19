# Builder API Contract

## ConfigBuilder

```typescript
class ConfigBuilder {
	configure(options: Record<string, unknown>): this;
	task(name: string, action?: string): this;
	taskWithConfig(name: string, config: Record<string, unknown>, action?: string): this;
	toString(): string;
}

function config(): ConfigBuilder;
```

### ConfigBuilder.toString() output format

```typescript
// Always starts with import (only included imports)
import { tasks, configure } from "nadle";

// configure() block (if called)
configure({
	maxWorkers: 7
});

// task registrations (in order added)
tasks.register("hello", () => {
	console.log("Hello!");
});

tasks.register("build").config({
	dependsOn: ["lint"]
});
```

## FixtureBuilder

```typescript
class FixtureBuilder {
	packageJson(name?: string, fields?: PackageJsonFields): this;
	config(builder: ConfigBuilder): this;
	config(name: string, builder: ConfigBuilder): this;
	configRaw(content: string, fileName?: string): this;
	file(path: string, content: string): this;
	dir(path: string, contents?: DirJSON): this;
	build(): DirJSON;
}

function fixture(): FixtureBuilder;

interface PackageJsonFields {
	type?: "module" | "commonjs";
	nadle?: { root?: boolean };
	dependencies?: Record<string, string>;
	[key: string]: unknown;
}
```

### Config name resolution

| Input                  | Output filename    |
| ---------------------- | ------------------ |
| `config(builder)`      | `nadle.config.ts`  |
| `config("foo", b)`     | `nadle.foo.ts`     |
| `config("a.b.ts", b)`  | `a.b.ts` (literal) |
| `config("cfg.js", b)`  | `cfg.js` (literal) |
| `configRaw(s)`         | `nadle.config.ts`  |
| `configRaw(s, "x.ts")` | `x.ts`             |

### PackageJson defaults

```json
{
	"name": "<provided or 'fixture'>",
	"type": "module",
	"private": true,
	"dependencies": { "nadle": "workspace:*" },
	"nadle": { "root": true }
}
```

## withGeneratedFixture

```typescript
function withGeneratedFixture(params: {
	files: DirJSON;
	preserve?: boolean;
	testFn: (params: { exec: Exec; cwd: string }) => Awaitable<void>;
}): Promise<void>;
```

### Behavior

1. Creates `test/__temp__/<randomHash>/`
2. Writes `files` via `fixturify.writeSync`
3. Creates `node_modules/nadle` symlink → `packages/nadle/`
4. Calls `testFn({ exec: createExec({ cwd }), cwd })`
5. On success + !preserve: removes temp dir
6. On failure: logs preserved path, rethrows
