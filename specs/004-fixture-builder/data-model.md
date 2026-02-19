# Data Model: Fixture Builder

## Entities

### ConfigBuilder

Generates nadle config file content as a string.

**State**:

- `imports`: Set of named imports from `"nadle"` (e.g., `"tasks"`, `"configure"`)
- `configureOptions`: Optional object to serialize as `configure({...})` call
- `tasks`: List of task entries, each with:
  - `name`: string (task name)
  - `action`: optional string (raw function body, e.g., `() => console.log("hello")`)
  - `configOptions`: optional object (serialized as `.config({...})`)

**Operations**:

- `configure(options)` → adds "configure" import, stores options → returns `this`
- `task(name, action?)` → adds "tasks" import, appends task entry → returns `this`
- `taskWithConfig(name, config, action?)` → same as task + stores config options → returns `this`
- `toString()` → renders all state as valid TypeScript config file content

### FixtureBuilder

Assembles a `fixturify.DirJSON` directory structure.

**State**:

- `files`: `fixturify.DirJSON` object (nested string/object map)

**Operations**:

- `packageJson(name?, fields?)` → adds `package.json` with defaults (type: module, private, nadle.root, workspace dep) → returns `this`
- `config(builder)` → adds `nadle.config.ts` with builder output → returns `this`
- `config(name, builder)` → adds `nadle.{name}.ts` (or literal filename if name contains ".") → returns `this`
- `configRaw(content, fileName?)` → adds raw config string as named file → returns `this`
- `file(path, content)` → adds file at nested path → returns `this`
- `dir(path, contents?)` → adds directory at nested path → returns `this`
- `build()` → returns shallow copy of the assembled `DirJSON`

### Generated Fixture (runtime)

The written-out fixture in a temp directory, used during test execution.

**Structure**:

```
test/__temp__/<hash>/
├── package.json
├── nadle.config.ts (or variants)
├── node_modules/
│   └── nadle -> <absolute path to packages/nadle>
└── [additional files/dirs]
```

**Lifecycle**: Created by `withGeneratedFixture` → used by test → cleaned up on success / preserved on failure.

## Relationships

```
ConfigBuilder --builds--> config file content (string)
FixtureBuilder --uses--> ConfigBuilder.toString() for config files
FixtureBuilder --builds--> fixturify.DirJSON
withGeneratedFixture --writes--> DirJSON to temp dir
withGeneratedFixture --creates--> node_modules/nadle symlink
withGeneratedFixture --provides--> { exec, cwd } to test function
```
