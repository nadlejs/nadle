<h1 align="center">
Nadle
</h1>
<p align="center">
Gradle-inspired task runner for Node.js.
<p>
<p align="center">
  <a href="https://www.npmjs.com/package/nadle"><img src="https://img.shields.io/npm/v/nadle?color=3B7FC4&label="></a>
<p>

<p align="center">
<a href="https://www.nadle.dev/docs/why-nadle">Why</a> |
<a href="https://www.nadle.dev/docs/getting-started/installation">Installation</a> |
<a href="https://www.nadle.dev/docs/getting-started/features">Features</a> |
<a href="https://www.nadle.dev/docs/getting-started/playground">Playground</a> |
<a href="https://www.nadle.dev/docs/config-reference">Configuration Reference</a>
</p>

<p align="center">
<a href="https://pkg.pr.new/~/nadlejs/nadle"><img alt="pkg.new.pr" src="https://pkg.pr.new/badge/nadlejs/nadle?style=flat&color=3B7FC4"></a>
<a href="https://npmjs.com/package/nadle"><img src="https://img.shields.io/npm/dm/nadle?style=flat&colorA=17334F&colorB=3B7FC4" alt="npm downloads"></a>
<a href="https://github.com/nadlejs/nadle/actions/workflows/ci.yml"><img alt="ci" src="https://img.shields.io/github/actions/workflow/status/nadlejs/nadle/ci.yml?branch=main&label=CI&labelColor=17334F&color=3B7FC4"></a>
<a href="https://github.com/nadlejs/nadle/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/github/license/nadlejs/nadle?labelColor=17334F&color=3B7FC4"></a>
</p>

![Demo](https://raw.githubusercontent.com/nadlejs/nadle/main/.assets/demo.gif)

## Features

- ⚡ Fast, parallel task execution for monorepos and multi-package workspaces
- 🧩 Dependency-aware workflows with automatic task resolution
- 🛠️ Flexible configuration via TypeScript, JSON, or CLI
- 🔄 Task aliasing and custom task mapping
- 🗂️ Built-in caching for efficient incremental runs
- 📝 Dry run, summary, and detailed logging support
- 🧪 Easy integration with existing scripts and tools
- 📦 Works seamlessly with modern JavaScript/TypeScript projects

## Getting Started

## Build

This repository uses **Nadle to build itself** — showcasing how it can serve as a fast, type-safe, and flexible build system for modern JavaScript/TypeScript projects.

Install dependencies:

```bash
pnpm install
```

Build with Nadle itself:

```bash
nadle build
```

## Credits

Thanks to:

- The [Gradle team](https://gradle.org/) and community for inspiring Nadle’s API and dependency model.
- The [Vitest team](https://vitest.dev/) for their excellent testing framework and for the reporter logic we reuse.

## Contribution

See [Contributing Guide](https://github.com/nadlejs/nadle/blob/main/CONTRIBUTING.md)

## License

[MIT](./LICENSE) License © 2025-Present [Nam Hoang Le](https://github.com/nam-hle)
