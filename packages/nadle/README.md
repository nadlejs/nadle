![Demo](https://raw.githubusercontent.com/nadlejs/nadle/main/.assets/demo.gif)

[![npm](https://img.shields.io/npm/v/nadle)](https://www.npmjs.com/package/nadle)
[![npm](https://img.shields.io/npm/dm/nadle)](https://www.npmjs.com/package/nadle)
[![License](https://img.shields.io/github/license/nadlejs/nadle)](LICENSE)
[![Build](https://github.com/nadlejs/nadle/actions/workflows/ci.yml/badge.svg)](https://github.com/nadlejs/nadle/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=nam-hle_nadle&metric=alert_status)](https://sonarcloud.io/summary/?id=nam-hle_nadle)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=nam-hle_nadle&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=nam-hle_nadle)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/nadlejs/nadle)

A modern, type-safe task runner for Node.js inspired by the awesome Gradle build tool,
supporting parallel execution and streamlined build automation.

## Features

- First-class TypeScript support with full type inference
- Modern ESM package
- Lightweight and efficient
- Task dependency management
- Parallel task execution
- Progress tracking
- Configurable logging levels

## Getting Started

- [Why Nadle?](https://www.nadle.dev/docs/why-nadle)
- [Installation](https://www.nadle.dev/docs/getting-started/installation)
- [Features](https://www.nadle.dev/docs/getting-started/features)
- [Playground](https://www.nadle.dev/docs/getting-started/playground)
- [Configuration Reference](https://www.nadle.dev/docs/config-reference)

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

## Contribution

See [Contributing Guide](https://github.com/nadlejs/nadle/blob/main/CONTRIBUTING.md)

## License

[MIT](./LICENSE) License © 2025-Present [Nam Hoang Le](https://github.com/nam-hle)
