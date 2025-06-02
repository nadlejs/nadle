# Introduction

Nadle is a **modern**, **type-safe**, **Gradle-inspired** task runner for Node.js.  
Built from the ground up with TypeScript, Nadle helps developers define and orchestrate project workflows with clarity, safety, and speed.

## ✨ Why Nadle?

- 🛡️ **Type-Safe by Design**  
  Written in TypeScript with full type inference and compile-time validation for every task.

- ⚡ **Smart Parallel Execution**  
  Automatically runs independent tasks in parallel while respecting declared dependencies. Supports worker pool configuration.

- 🧠 **Modern Architecture**  
  Native ESM support, Node.js 20+ only. Zero legacy baggage.

- 🧩 **Extensible Plugin System**  
  Easily create typed plugins with hooks, custom task types, and integrations. Core plugin set coming soon.

- 🧘‍♂️ **Intuitive Task Management**  
  Simple and declarative `nadle.config.ts`. Group tasks, add descriptions, and define dependencies clearly.

- 🖥️ **Real-Time Feedback**  
  Live progress tracking and performance metrics make task execution transparent and reliable.

- 🧠 **Abbreviation Matching**  
  Run tasks via short patterns (`b` for `build`) — fast and user-friendly CLI UX.

---

## 🧪 Try Nadle Now

👉 Use [StackBlitz](https://stackblitz.com/github/nam-hle/nadle/tree/main/packages/examples/basic?file=package.json) to try Nadle instantly in your browser.  
🚧 A CLI installer for local setup is coming soon.

---

## 🛠️ Requirements

- Node.js **20+**
- Supports **both ESM and CommonJS**

---

## 🔍 Feature Comparison

| Feature                | Nadle             | npm scripts    | Gulp          | Make       | Just        |
| ---------------------- | ----------------- | -------------- | ------------- | ---------- | ----------- |
| Type Safety            | ✅ Yes            | ❌ No          | ❌ No         | ❌ No      | ❌ No       |
| Modern Defaults        | ✅ ESM, clean     | ⚠️ Limited     | ❌ Legacy     | ❌ Legacy  | ⚠️ Basic    |
| Parallel Execution     | ✅ Built-in       | ❌ No          | ⚠️ Manual     | ✅ Manual  | ⚠️ Manual   |
| Abbreviation Matching  | ✅ Yes            | ❌ No          | ❌ No         | ❌ No      | ❌ No       |
| Plugin System          | ✅ Typed          | ❌ No          | ✅ Yes        | ❌ No      | ❌ No       |
| Task Grouping/Metadata | ✅ Native         | ❌ No          | ⚠️ Manual     | ❌ No      | ❌ No       |
| CLI UX                 | ✅ Clean          | ⚠️ Verbose     | ⚠️ Verbose    | ❌ Complex | ✅ Simple   |
| Config Format          | `nadle.config.ts` | `package.json` | `gulpfile.js` | `Makefile` | `.justfile` |

---

## 💼 Real-World Use Cases

Nadle works seamlessly in:

- Monorepo task orchestration
- CI/CD pipelines
- Frontend or full-stack builds
- Local dev automation

---

## 🛠️ Editor Support

- ✅ CLI-based setup (coming soon)
- 🧩 VS Code and IntelliJ plugins planned

---

## 🧑‍💻 Contribute

Have ideas or feedback?  
📬 [Open an issue on GitHub](https://github.com/nam-hle/nadle/issues) — we welcome your input!

---

## 🔮 Coming Soon

- Core plugin pack with common tasks
- VS Code & IntelliJ integrations
- Guided tutorial and onboarding CLI
- Showcase examples and templates
