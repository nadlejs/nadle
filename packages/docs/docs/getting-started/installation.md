# Installation

Getting started with Nadle is straightforward. Follow these steps to add Nadle to your project.

## Prerequisites

Before installing Nadle, make sure you have:

- Node.js 22.x or later
- npm 10.x or later (or yarn/pnpm)
- TypeScript 5.8+ (recommended)

## Quick Install

You can install Nadle using your preferred package manager:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="npm" label="npm">

```bash
npm install -D nadle
```

  </TabItem>
  <TabItem value="yarn" label="yarn">

```bash
yarn add -D nadle
```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

```bash
pnpm add -D nadle
```

  </TabItem>
</Tabs>

After installation, verify that Nadle is working correctly:

```bash
nadle --version
```

You should see the current version of Nadle printed to your terminal.

## Write nadle.config.ts

The `nadle.config.ts` file serves as the central entry point for defining and organizing your Nadle tasks.
It’s where task logic, metadata, and dependencies come together to form your build pipeline.
Copy the following template to create your first `nadle.config.ts` file:

```typescript
import { tasks } from "nadle";

tasks
	.register("hello", async () => {
		console.log("Hello from nadle!");
	})
	.config({ group: "Greetings", description: "Say hello" });

tasks
	.register("goodbye", () => {
		console.log("Goodbye, tak!");
	})
	.config({ group: "Greetings", dependsOn: ["hello"], description: "Say goodbye" });
```

This configuration defines two greeting tasks: `hello`, which logs a message, and `goodbye`,
which depends on `hello` and logs a farewell message.

Run it with:

```bash
nadle goodbye
```

You should see the output:

```
> Task hello started
Hello from Nadle!
✓ Task hello done in 1ms
> Task goodbye started
Goodbye, Nadle!
✓ Task goodbye done in 0ms

RUN SUCCESSFUL in 505ms (2 tasks executed)
```
