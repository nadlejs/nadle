---
description: Use the configure() function in nadle.config.ts to set global runtime options like log level, parallelism, and cache behavior.
keywords: [nadle, configure, global settings, runtime, nadle.config.ts]
---

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

## Validation

Nadle validates the options you pass to `configure()` when the config file loads. A malformed
value — a wrong type, an unknown `logLevel`/`reporter`, a non-positive `maxCacheEntries`, an empty
`cacheDir`, or a bad `minWorkers`/`maxWorkers` — fails fast with a clear configuration error
instead of being silently ignored or surfacing later as a confusing runtime failure.
