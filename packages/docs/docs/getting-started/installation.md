---
description: Install Nadle with npm, yarn, or pnpm and set up your first nadle.config.ts in minutes. Requires Node.js 22 or later.
keywords: [nadle, install, npm, yarn, pnpm, setup, getting started]
---

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

<AgentPrompt>
Set up Nadle in this repository. First read the Nadle docs for the current API — fetch https://nadle.dev/llms.txt (or browse https://nadle.dev/docs). Then install `nadle` as a dev dependency, create a `nadle.config.ts` at the project root that registers a `build` task running `tsc` and a `test` task that depends on `build`, and run `nadle build` to verify. Use the keyed task spec form: `tasks.register("build", { run: ExecTask, options: { command: "tsc" } })`.
</AgentPrompt>

## Write nadle.config.ts

The `nadle.config.ts` file serves as the central entry point for defining and organizing your Nadle tasks.
It’s where task logic, metadata, and dependencies come together to form your build pipeline.
Copy the following template to create your first `nadle.config.ts` file:

```typescript
import { tasks } from "nadle";

tasks.register("hello", {
	run: async () => {
		console.log("Hello from nadle!");
	},
	group: "Greetings",
	description: "Say hello"
});

tasks.register("goodbye", {
	run: () => {
		console.log("Goodbye, tak!");
	},
	group: "Greetings",
	dependsOn: ["hello"],
	description: "Say goodbye"
});
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

## Migrating an existing project

Already have npm scripts? Hand this prompt to your AI agent to convert them to Nadle tasks.
(Dedicated migration guides — from npm scripts, Turborepo, Nx, and Makefile — are tracked in [#650](https://github.com/nadlejs/nadle/issues/650).)

<AgentPrompt>
Migrate this repository's npm scripts to Nadle. First read the Nadle docs for the current API — fetch https://nadle.dev/llms.txt (or browse https://nadle.dev/docs). Then, for each script in package.json, register an equivalent Nadle task in `nadle.config.ts` using the keyed spec form (`tasks.register("name", { run: ExecTask, options: { command, args } })`), preserve the original behavior, wire up `dependsOn` where one script calls another, and leave the npm scripts in place until I confirm the Nadle tasks work.
</AgentPrompt>
