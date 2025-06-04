# Why Nadle?

Nadle is a modern build and task automation tool designed specifically for JavaScript and TypeScript projects. It brings the best of Gradle's smart execution model into the Node.js ecosystem — without needing to install Java or write in Kotlin.

While Gradle, npm scripts, and other tools have their place, they each fall short when applied to the world of modern fullstack JavaScript.
Nadle fills that gap with a purpose-built engine for scalable, scriptable builds without the legacy baggage.

## Gradle: Powerful but Not Meant for JavaScript

Gradle is one of the most powerful build tools ever created. But it was built for Java and the JVM world. Using Gradle in a frontend or fullstack JavaScript project introduces several layers of friction:

- Requires Java to be installed — a non-starter for many frontend setups.
- Uses Groovy or Kotlin DSL — not intuitive for JavaScript developers.
- Difficult to integrate with common JS workflows, toolchains, or monorepos.

Nadle takes inspiration from Gradle’s architecture — task graphs, up-to-date checks, caching — but builds it in native TypeScript. No extra runtimes. No unfamiliar syntax. Just code that works with the ecosystem already in use.

## npm scripts: Convenient Until They Collapse

It’s easy to start with `npm run`, but hard to scale with it.

Projects often end up with a dozen or more scripts in `package.json`, many of which repeat logic or awkwardly chain commands using `&&` and `||`. Want to define task dependencies? You’re stuck with the limited `pre` and `post` hooks. Need to repeat a task with different arguments? There’s no native support — copy-paste or complex Bash hacks are your only options.

Nadle fixes all of this. It provides a proper task model, with dependency declarations, parameterized execution, and built-in type safety. You can define and reuse logic in actual TypeScript, not stringly-typed one-liners jammed into JSON.

## nx and turbo: Feature-Rich but Heavy-Handed

Tools like **nx** and **turborepo** are powerful monorepo platforms, and they bring good defaults to large workspaces. But their strength is also their drawback — they are tightly integrated, framework-aware, and opinionated.

- Custom logic is hard to express. Want a task that loops or reacts dynamically? You’re limited by their config formats.
- Debugging and understanding execution order often requires deep platform knowledge.
- They bring lots of surface area and abstractions, even when only basic task execution is needed.

Nadle takes a different approach. It gives full control and visibility to the developer — a transparent system with powerful defaults, but no lock-in. You can build your own workflows using actual code, not DSLs or conventions.

## Make, Just, and Shell Scripts: Minimal but Primitive

Unix-style task runners like `Make`, `Just`, or plain shell scripts offer raw power. But they come with old assumptions:

- No native support for dependency graphs — you must declare everything manually.
- Difficult to write cross-platform logic (Windows vs Unix).
- No native TypeScript/JavaScript integration — you’re stuck outside your main ecosystem.

Nadle speaks the same language as your project. You can `import`, `configure`, and `run` tasks all in the same environment your app runs in. It's code-first, type-safe, and cross-platform by default.

## Gulp and Grunt: Yesterday’s Abstractions

Gulp and Grunt helped define early JavaScript build tooling, but their plugin-heavy, file-centric approach hasn’t aged well. Their flexibility is limited by APIs that prioritize streams and file transformations over task orchestration.

Nadle is built with today’s needs in mind: fast local builds, scalable monorepos, intelligent caching, and flexible APIs. It avoids legacy concepts and offers a clean, minimal surface designed for composability.

## Why Nadle (Will) Wins

Nadle gives developers the best parts of modern build systems — task graphs, parallel execution, caching — while removing the pain of configuration-heavy platforms or limited script runners.

- It’s **typed**: No more misspelled task names or broken logic hidden in stringified scripts.
- It’s **declarative** and **programmable**: Declare dependencies clearly, and express complex flows with real code.
- It’s **ecosystem-native**: Uses ESM, respects Node.js conventions, and integrates easily with any frontend or backend stack.
- It’s **lightweight** but **scalable**: Start with a single task. Grow to a monorepo without switching tools.
- It’s **designed to be extended**: Plugins, custom tasks, shared utilities — all possible without fighting against the tool.
