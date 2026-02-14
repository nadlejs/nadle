# Nadle Roadmap

## Vision

**Nadle is Gradle's task model, native to TypeScript.**

The JS ecosystem has two extremes:

- **Lightweight command runners** (npm scripts, just, Wireit) — no real build intelligence
- **Enterprise monorepo platforms** (Nx, Turborepo, moon) — heavy, opinionated, config-driven

Nadle sits in the middle: **a programmable build tool with real task intelligence**, where your
build logic is TypeScript code — not JSON, not YAML, not a DSL. You get Gradle's power (DAG
scheduling, caching, parallel execution) without the JVM, without vendor lock-in, and without
enterprise bloat.

## Core Differentiators

1. **Code over configuration** — `nadle.config.ts` is real TypeScript. Import libraries, use
   conditionals, share task definitions across packages via npm. Turborepo and Nx force you into
   JSON/YAML.
2. **Type-safe task contracts** — `defineTask<Options>()` gives compile-time validation of task
   inputs. No other JS build tool does this.
3. **Works for 1 package or 100** — Turborepo is monorepo-only. Nadle works equally well for a
   single-package CLI tool or a large monorepo.
4. **Local-first, no cloud required** — Caching works out of the box with zero sign-up.
5. **Lightweight** — 140KB. Installs in seconds, not minutes.

## Target Users

| Persona                         | Pain                                                    | Nadle's answer                                  |
| ------------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| **Team outgrowing npm scripts** | `"scripts"` section is 40 lines of unmaintainable shell | Type-safe tasks with dependencies and caching   |
| **Gradle refugee**              | Moved from JVM to Node, misses task DAG model           | Same mental model, TypeScript instead of Groovy |
| **Anti-complexity developer**   | Tried Nx, felt like fighting the tool                   | Minimal API, transparent behavior, no magic     |
| **Monorepo pragmatist**         | Wants smart builds but not a "platform"                 | Workspace support without lock-in               |

## Milestones

### v0.6 — Onboarding & Correctness

_Goal: Someone can go from zero to productive in 5 minutes._

- **`create-nadle`** (#366, #368) — `npm create nadle` scaffolds a working config. Detect monorepo,
  generate appropriate tasks.
- **Caching correctness** (#246, #248) — Include task options and dependent task outputs as cache
  inputs. Without this, caching can produce wrong results, which kills trust.
- **Workspace dependency ordering** (#362) — Respect `dependencies` in `package.json` during
  execution. Critical for monorepo correctness.
- **Fix Windows caching** (#223) — Cross-platform reliability.
- **Docs: "Getting Started in 5 minutes"** — Install, define 3 tasks, see caching + parallelism
  work. Side-by-side comparison with the equivalent npm scripts.

### v0.7 — Developer Experience

_Goal: Nadle is pleasant to use daily during active development._

- **Watch mode** (#265) — Re-run tasks on file changes. Use the existing `inputs` declarations to
  know what to watch. Table-stakes for any modern dev tool.
- **Task graph output** (#110) — `nadle --graph` prints the DAG as text. Essential for debugging
  dependency issues.
- **Glob task selection** (#145) — `nadle "build*"` or `nadle "*:test"`. Power-user feature that
  pays off in monorepos.
- **Shell completion** (#128) — zsh/bash/fish. Cheap polish that signals maturity.
- **New version announcement** (#70) — Subtle nudge to upgrade.

### v0.8 — Extensibility

_Goal: Community can build and share task types._

- **Plugin system** — A `nadle.plugin.ts` convention where plugins can:
  - Register tasks
  - Add configuration options
  - Hook into lifecycle events (beforeTask, afterTask, beforeAll, afterAll)
- **First-party plugins** — Seed the ecosystem:
  - `@nadle/plugin-typescript` — tsc with project references, incremental
  - `@nadle/plugin-eslint` — lint with caching awareness
  - `@nadle/plugin-vitest` — test with coverage tracking
- **Ergonomic API improvements** (#90) — Option-less shared tasks shouldn't require empty `{}`.

### v0.9 — Scale

_Goal: Nadle works well for large monorepos._

- **Remote build cache** — HTTP-based cache backend (S3, GCS, or custom server). The #1 feature
  teams ask for when adopting build tools at scale.
- **Configuration avoidance** — Lazy task configuration so large monorepos don't pay startup cost
  for tasks they won't run.
- **Improved profiling** — Which tasks are slow? Which are cache-misses? Push `--summary` further
  with actionable insights.
- **Move task** (#126) — Built-in file operations round out the toolkit.

### v1.0 — Stable & Complete

_Goal: Public API is stable, documented, and battle-tested._

- **API freeze** — Lock `index.api.md`, follow semver strictly.
- **Migration guides** — From npm scripts, from Turborepo, from Nx, from Makefile.
- **Case studies** — Real projects using nadle (starting with nadle itself — self-hosting is a
  strong signal).
- **Web-based task explorer** (#266) — Optional differentiator for debugging complex task graphs.

## Non-Goals

Keeping scope tight is how a solo maintainer wins:

- **No code generation / scaffolding beyond init** — That's Nx's territory, and it's a maintenance
  black hole.
- **No AI features** — Nadle's value is being understandable and predictable.
- **No polyglot claims** — Stay TypeScript/JavaScript native. `ExecTask` already lets you shell out
  to anything.
- **No cloud platform** — Offer remote cache protocol, but don't build a SaaS. Let users bring
  their own storage.
- **No daemon mode (yet)** — Complexity isn't worth it until startup time is actually a problem at
  scale.

## Positioning

> **Nadle: Build with TypeScript, not configuration files.**
>
> A Gradle-inspired task runner where your build logic is real TypeScript — type-safe, parallel,
> cached, and monorepo-ready. 140KB, zero cloud dependency, works for one package or one hundred.
