# Introduction

Nadle is a **modern**, **type-safe**, **Gradle-inspired** task runner for Node.js.
Built from the ground up with TypeScript, Nadle helps developers define and orchestrate project workflows with clarity, safety, and speed.

## Why Nadle?

- **Type-Safe by Design**
  Written in TypeScript with full type inference and compile-time validation for every task.

- **Smart Parallel Execution**
  Automatically runs independent tasks in parallel using worker threads while respecting declared dependencies.

- **Modern Architecture**
  Pure ESM, Node.js 22+ only. Zero legacy baggage.

- **Built-in Caching**
  Declare inputs and outputs for any task. Unchanged tasks are skipped automatically for fast incremental builds.

- **Intuitive Task Management**
  Simple and declarative `nadle.config.ts`. Group tasks, add descriptions, and define dependencies clearly.

- **Real-Time Feedback**
  Interactive footer shows scheduled, running, and completed tasks. Live progress tracking makes builds transparent.

- **Abbreviation Matching**
  Run tasks via short patterns (`b` for `build`) — fast and user-friendly CLI UX.

---

## Try Nadle Now

Use [StackBlitz](https://stackblitz.com/github/nadlejs/nadle/tree/main/packages/examples/basic?file=package.json) to try Nadle instantly in your browser.

Ready to install locally? See the [Installation Guide](./getting-started/installation.md).

---

## Requirements

- Node.js **22+**
- **ESM only**

---

## Feature Comparison

| Feature                | Nadle             | npm scripts    | Gulp          | Make       | Just        |
| ---------------------- | ----------------- | -------------- | ------------- | ---------- | ----------- |
| Type Safety            | Yes               | No             | No            | No         | No          |
| Modern Defaults        | ESM, Node 22+     | Limited        | Legacy        | Legacy     | Basic       |
| Parallel Execution     | Built-in          | No             | Manual        | Manual     | Manual      |
| Built-in Caching       | Yes               | No             | No            | Partial    | No          |
| Built-in Tasks         | Yes               | No             | Plugin-based  | No         | No          |
| Abbreviation Matching  | Yes               | No             | No            | No         | No          |
| Task Grouping/Metadata | Native            | No             | Manual        | No         | No          |
| CLI UX                 | Clean             | Verbose        | Verbose       | Complex    | Simple      |
| Config Format          | `nadle.config.ts` | `package.json` | `gulpfile.js` | `Makefile` | `.justfile` |

---

## Real-World Use Cases

Nadle works seamlessly in:

- Monorepo task orchestration
- CI/CD pipelines
- Frontend or full-stack builds
- Local dev automation

---

## Editor Support

TypeScript gives you IntelliSense and compile-time checks out of the box in any editor. Dedicated VS Code and IntelliJ plugins are planned.

---

## Contribute

Have ideas or feedback?
[Open an issue on GitHub](https://github.com/nadlejs/nadle/issues) — we welcome your input!

---

## Roadmap

- VS Code & IntelliJ integrations
- Guided tutorial and onboarding CLI
- Showcase examples and templates
