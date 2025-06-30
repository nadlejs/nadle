# Configuring Nadle

In addition to CLI flags, Nadle can be configured programmatically within the `nadle.config.ts` file using the `configure()` function.
This allows you to define global runtime behavior that applies to all tasks.

Call `configure()` once at the top of your config file before registering any tasks.

---

## Example

```ts title="nadle.config.ts"
import { configure } from "nadle";

configure({
	footer: true,
	maxWorkers: 3
});

// Task registrations follow...
```

This will:

- Enable the in-progress execution footer
- Limit concurrency to 3 worker threads

:::note

If a value is provided both via CLI and via `configure(...)`, the CLI value will take precedence.

:::

## Available Options

For a full list of supported configuration fields and their types, see [Common Options section](../config-reference#common-options) in the config reference.
