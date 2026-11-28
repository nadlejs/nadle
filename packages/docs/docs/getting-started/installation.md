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

## Installing a release minutes after it ships

pnpm applies a `minimumReleaseAge` delay by default (reported for pnpm 12: 24 hours), so a release
published minutes ago can fail to install. The failure goes away by itself once the release is old
enough. Until then, exempt the exact version in `pnpm-workspace.yaml`.

```yaml
minimumReleaseAgeExclude:
  - nadle@0.6.0
```

If a follow-up release ships soon after, pnpm appends to the exemption rather than replacing it
(reported, for example `nadle@0.6.0 || 0.6.1`). Nothing prunes it, so the list grows silently.
Once the superseded version is past the age threshold, delete its entry. We recommend exempting only the
exact version you are installing, as above, so each entry is easy to retire; a range has no
single moment at which it becomes safe to remove.

:::note
The default delay and the appending behavior are reported by users, not verified against
pnpm's own documentation.
:::
