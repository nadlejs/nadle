# Nadle Roadmap

## Vision

**Nadle: your build is code you can ship.**

The JS ecosystem forces a false choice:

- **Command runners** (npm scripts, just, Wireit) — fast to start, but no real build
  intelligence. Your `"scripts"` block becomes 40 lines of unmaintainable shell.
- **Monorepo platforms** (Nx, Turborepo, moon) — real DAG/caching/parallelism, but config-driven
  (JSON/YAML), heavy, and built to pull you toward a platform.

Nadle takes a third path: **build logic is a real TypeScript program.** Not a config file the tool
interprets — actual code the tool executes. That single decision is the whole product:

- Task types are **npm packages** — import them, parameterize them, share them across repos.
- Configuration is **type-checked** — wrong options are compile errors, not runtime surprises.
- The same task definitions power your **CLI, your editor (LSP), your linter, and your CI**.

Every config-driven tool can match nadle's _execution_ (DAG, caching, parallelism). None can match
its _composition_: a JSON file can't import a function, validate its own inputs, or be published to
a registry. That's the moat, and it's why nadle releases its own toolchain with nadle, builds itself
with its own task types, and catches its own bugs by dogfooding.

Three pillars follow from "shippable," and the roadmap is organized around them:

1. **Authoring** — defining tasks is pleasant and type-safe.
2. **Trust** — caching is correct, observable, and never lies. A build tool nobody trusts gets
   `--no-cache`'d into a glorified script runner.
3. **Distribution** — task types travel as packages, with a real ecosystem.

## Core Differentiators

1. **Code over configuration** — `nadle.config.ts` is real TypeScript. Import libraries, use
   conditionals, compose task types from npm. Turborepo and Nx force you into JSON/YAML.
2. **Type-safe task contracts** — `defineTask<Options>()` gives compile-time validation of task
   inputs. No other JS build tool does this.
3. **One model, three surfaces** — CLI, language server, and ESLint plugin all read the same task
   definitions. Your editor understands your build because it _is_ your code.
4. **Works for 1 package or 100** — equally at home in a single-package CLI or a large monorepo.
   Turborepo is monorepo-only.
5. **Local-first, no cloud required** — caching works out of the box with zero sign-up.
6. **Lightweight** — ~160 KB. Installs in seconds, not minutes.

## Target Users

| Persona                         | Pain                                                    | Nadle's answer                                  |
| ------------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| **Team outgrowing npm scripts** | `"scripts"` section is 40 lines of unmaintainable shell | Type-safe tasks with dependencies and caching   |
| **Gradle refugee**              | Moved from JVM to Node, misses task DAG model           | Same mental model, TypeScript instead of Groovy |
| **Anti-complexity developer**   | Tried Nx, felt like fighting the tool                   | Minimal API, transparent behavior, no magic     |
| **Monorepo pragmatist**         | Wants smart builds but not a "platform"                 | Workspace support without lock-in               |
| **Library author**              | Wants to ship reusable build steps, not copy-paste      | Task types are npm packages                     |

## Milestones

Ordering principle: **trust before features.** A flaky cache or an unobservable build destroys the
one durable advantage — "I believe what nadle tells me." Correctness and observability gate the
shiny stuff.

### v0.6 — Foundations ✓ (shipped)

_Someone can go from zero to productive in 5 minutes._

- **`create-nadle`** — `npm create nadle` scaffolds a working config; detects monorepo, generates
  appropriate tasks.
- **Caching correctness** — task options and dependent outputs participate in the cache key.
- **Workspace dependency ordering** — respects `package.json` dependencies during execution.
- **`eslint-plugin-nadle`** — 11 config-file lint rules; `recommended` + `all` presets.
- **`@nadle/kernel`** — zero-dependency shared core (workspace identity, task identifiers, aliases).
- **`@nadle/project-resolver`** — project discovery + workspace scanning, shared with the LSP.
- **Self-hosting** — nadle builds, tests, and releases itself with nadle.

### v0.7 — Trust (next)

_You believe the cache, and when you don't, nadle tells you why._

The unglamorous milestone everything rests on.

- **Output-existence verification** (#630) — deleted outputs must invalidate the cache. Today a
  task reports `UP-TO-DATE` even when its declared outputs are gone; this is a correctness bug that
  erodes trust the first time it bites.
- **Cache observability** — `--summary` and a `--why <task>` flag that explain every hit/miss:
  which input changed, which key differed. "Why did this rebuild?" should never be a mystery.
- **Task graph output** (#110) — `nadle --graph` prints the DAG as text (and Mermaid). Debugging
  dependency issues is part of trust.
- **Stabilize flaky tests** (#417) — a tool that flakes its own CI hasn't earned trust.
- **Faster, correct worker init** (#410) — stop re-transpiling the config per worker thread; the
  test suite is the slowest part of our own CI.
- **Skipped/TODO test cleanup** (#416, #420) — close the cross-platform coverage gaps.

### v0.8 — Developer Experience

_Nadle is a joy to use during active development._

The features users ask for first and stay for.

- **Watch mode** (#265) — re-run tasks on file change, driven by existing `inputs` declarations.
  The headline feature; nadle already knows what to watch.
- **Interactive TUI** — a live task-graph view: what's running, queued, cached, failed, with
  per-task timing. Turns `--summary` into something you watch in real time.
- **Glob & smart task selection** (#145) — `nadle "build*"`, `nadle "*:test"`, plus fuzzy
  correction ("did you mean `build`?").
- **Shell completion** (#128) — zsh/bash/fish; completes task names from the live config.
- **`nadle why <task>`** — human-readable explanation of why a task will run and what depends on it.
- **Better failure output** — on failure, show the exact reproduction command, the failing task's
  logs surfaced (not buried), and a one-line "N tasks skipped due to this failure."
- **New version announcement** (#70) — subtle upgrade nudge.

### v0.9 — Distribution & Ecosystem

_The moat becomes real: task types are packages, and nadle uses its own._

- **Plugin system** — a `nadle.plugin.ts` convention. Plugins register task types, add config
  options, and hook lifecycle events (`beforeTask`, `afterTask`, `beforeAll`, `afterAll`).
- **First-party plugins, dogfooded** — `@nadle/plugin-typescript` (tsc/tsgo project references,
  incremental) and `@nadle/plugin-vitest` (test + coverage). Critically, these become _how nadle
  builds nadle_ — credibility no competitor can fake.
- **Plugin discovery** — `nadle add @nadle/plugin-x` wires a plugin into the config; a docs page
  lists community plugins.
- **Ergonomic API** (#90) — option-less shared tasks shouldn't require empty `{}`.

### v0.10 — Scale

_Nadle is excellent for large monorepos._

- **Remote build cache** — HTTP cache protocol (S3, GCS, or custom server). The #1 ask at scale.
  Bring your own storage; no SaaS.
- **Configuration avoidance** — lazy task configuration so big monorepos don't pay startup cost for
  tasks they won't run.
- **Profiling insights** — `--profile` flamegraph of task wall-clock; flag cache-miss hotspots and
  critical-path tasks with actionable suggestions.
- **Affected-only execution** — `nadle test --since main` runs only tasks touched by a diff, using
  the dependency graph. Table-stakes for CI in large repos.

### v1.0 — Stable & Complete

_The public API is frozen, documented, and battle-tested._

- **API freeze** — lock `index.api.md`, strict semver.
- **Migration guides** — from npm scripts, Turborepo, Nx, Makefile, with a codemod where feasible.
- **Web-based task explorer** (#266) — optional interactive DAG visualizer for complex graphs.
- **Case studies** — real projects on nadle, starting with nadle itself.

## Candidate Features (unscheduled, demand-driven)

Pulled into milestones as users ask. Listed so the direction is legible.

- **`nadle init` for existing repos** — import an npm `scripts` block into starter tasks.
- **Task input/output globbing helpers** — richer `Inputs`/`Outputs` matchers (env vars, git state).
- **Conditional & matrix tasks** — run a task across a parameter set (Node versions, OS) from one
  definition.
- **Per-task environment & secrets** — declarative env injection without shell plumbing.
- **`--dry-run` diffing** — show exactly what _would_ run and why, before committing to it.
- **JSON/SARIF output** — machine-readable results for CI integrations and dashboards.
- **Task timeouts & retries** — first-class, declarative, instead of hand-rolled wrappers.
- **Doctor command** — `nadle doctor` diagnoses config smells, cache health, stale outputs.

## Non-Goals

Keeping scope tight is how a small team wins:

- **No code generation / scaffolding beyond init** — that's Nx's territory and a maintenance black
  hole.
- **No AI features in the core** — nadle's value is being understandable and predictable.
- **No polyglot claims** — stay TypeScript/JavaScript native. `ExecTask` already shells out to
  anything.
- **No cloud platform** — offer a remote-cache protocol, never run a SaaS. Users bring their own
  storage.
- **No daemon mode (yet)** — complexity isn't worth it until startup time is provably a problem at
  scale.

## Positioning

> **Nadle: your build is code you can ship.**
>
> A Gradle-inspired task runner where build logic is real TypeScript — type-safe, parallel, cached,
> and monorepo-ready. Task types are npm packages; the same definitions drive your CLI, editor, and
> CI. ~160 KB, zero cloud dependency, works for one package or one hundred.
