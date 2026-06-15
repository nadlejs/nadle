# Agent-Friendly nadle.dev Design

**Status:** Approved (user approved 2026-06-15).
**Scope:** The Docusaurus docs site (`packages/docs/`). Make nadle.dev usable by AI
coding agents: copy a page as Markdown / open it in an assistant, and copy curated
agent-instruction prompts for common scenarios.
**Out of scope (follow-up issue):** an Nx-style CLI (`create-nadle --ai`) that
scaffolds `AGENTS.md`/`CLAUDE.md` into a user repo. Bigger build; deferred.

## Goal

When a developer uses an AI coding agent (Claude Code, Cursor, Copilot, …) and wants
nadle in their project, give them two frictionless on-ramps from the docs:

1. **Copy/open any doc page as Markdown** — one click to grab the current page as
   clean Markdown (to paste into an agent) or open it pre-loaded in Claude/ChatGPT.
   The emerging standard (Nx, Anthropic, Vercel docs all do this).
2. **Copy a ready-made agent prompt** — inline blocks on key guides that copy a
   natural-language instruction *to* an agent ("Set up Nadle in this repo: …"), so
   the user pastes it into their assistant and the agent does the work.

These compose: (1) is site-wide and cheap; (2) is scenario-specific and curated.

## Existing foundation (reuse, don't rebuild)

`@signalwire/docusaurus-plugin-llms-txt` is already configured
(`docusaurus.config.ts`) and emits per-page Markdown plus `llms.txt` /
`llms-full.txt` at build. So **every doc page already has a Markdown
representation** the copy/open affordances can point at. The agent quickstart
(`docs/getting-started/quickstart-for-agents.md`) and AI-crawler `robots.txt`
already shipped (#664–#668). This design adds the *interactive* layer on top.

## Component 1 — "Copy page" affordance (site-wide)

A small action group rendered at the top of every doc article (right of the H1),
via a swizzled Docusaurus `DocItem` (or `DocItem/Content` wrapper) theme component:

```
┌ Configuring Tasks ─────────────────── [📋 Copy page] [↗ Open in ▾] ┐
```

- **Copy page** — copies the current page's Markdown to the clipboard. Source: the
  page's generated `.md` (from the llms-txt plugin) fetched at click time, or the
  raw frontmatter+body if simpler. Falls back to copying a link if fetch fails.
- **Open in ▾** — a small menu: **Open in Claude**, **Open in ChatGPT**. Each opens
  the assistant with a pre-filled prompt that references the page URL + asks the
  assistant to read it (e.g. `https://claude.ai/new?q=<encoded prompt incl. page URL>`).
  Use each vendor's documented deep-link query param; if a vendor lacks one, omit
  that entry rather than guess.

Behavior:
- Shows a transient "Copied!" state on success.
- Lives in one component file; appears on all `docs/**` pages automatically.
- Degrades gracefully without JS (the buttons simply don't render or are inert).

## Component 2 — Inline agent-prompt block (`<AgentPrompt>`)

A reusable MDX component dropped into specific guide pages:

```mdx
<AgentPrompt title="Set up Nadle">
Set up Nadle in this repository. Install it as a dev dependency, create a
`nadle.config.ts` at the root with a `build` task that runs `tsc` and a `test`
task that depends on `build`, then run `nadle build` to verify.
</AgentPrompt>
```

Renders as a minimal admonition-style block (Docusaurus `:::tip` aesthetic — green
left border) with an uppercase "Prompt for your AI agent" label and a **Copy**
button (chosen layout: mockup option C). The copied text is the prompt body
verbatim (Markdown stripped to plain text on copy).

**Why a component, not raw code fences:** centralizes the copy UX + label, keeps
prompts visually distinct from runnable code blocks, and lets the prompts be linted
later (a future ESLint/test could assert each prompt's claimed commands still match
the CLI).

### Scenarios shipped (one `<AgentPrompt>` each, on the relevant page)

| Scenario | Page | Prompt gist |
|---|---|---|
| Setup | `getting-started/installation.md` (or quickstart-for-agents) | Install nadle, create a minimal `nadle.config.ts`, run a task to verify |
| Migrate | a migration guide page (new or existing per #650) | Migrate this repo's npm scripts to nadle tasks, preserving behavior |
| Common tasks | `guides/configuring-task.md` / caching guide | Add caching (inputs/outputs) to an existing task so unchanged inputs skip |
| Author a plugin | `guides/authoring-plugin.md` | Scaffold a nadle plugin with a task + reporter using `definePlugin` |

Prompts are written in the keyed-spec API (post-#688) and must stay accurate to the
shipped API.

## Architecture / files

- `packages/docs/src/theme/DocItem/Content/index.tsx` (swizzled) — renders the
  Component-1 action group above the article body. Wraps the original component;
  does not fork the whole DocItem.
- `packages/docs/src/components/CopyPageButton/` — the copy-page + open-in-assistant
  logic (clipboard, fetch the page `.md`, vendor deep links). One focused unit.
- `packages/docs/src/components/AgentPrompt/` — the inline prompt block (Component 2).
- MDX edits: add `<AgentPrompt>` to the 4 scenario pages (import auto-available via
  `@theme` or a global MDX scope registration in `docusaurus.config`/`MDXComponents`).
- No change to the llms-txt plugin config; it already produces the Markdown sources.

Each component is independently understandable: `CopyPageButton` knows "given the
current page, produce its Markdown + assistant links"; `AgentPrompt` knows "render
this text as a copyable prompt." Neither depends on the other.

## Data flow

- **Copy page:** click → resolve current page's `.md` URL (derive from the route, or
  read a frontmatter/route-mapped path the llms-txt plugin emits) → `fetch()` →
  `navigator.clipboard.writeText(markdown)` → "Copied!" toast. On fetch failure,
  copy the canonical page URL instead and label it accordingly.
- **Open in assistant:** click → build the vendor URL with an encoded prompt that
  includes the page URL → `window.open`.
- **Agent prompt:** click → `navigator.clipboard.writeText(promptText)` → "Copied!".

## Error handling

- Clipboard API unavailable / denied → fall back to selecting the text + a "press
  ⌘C" hint, or a `document.execCommand('copy')` fallback.
- `.md` fetch fails (offline, 404) → copy the page URL, toast "Link copied".
- Missing vendor deep-link → that menu entry is omitted at build, never a dead click.

## Testing

- Docs build green (`buildSite`) + `checkLinks` (no broken anchors introduced).
- A lightweight component test (if the docs package has a test setup) for
  `AgentPrompt` rendering its body + copy handler; otherwise manual verification via
  the dev server is acceptable for a docs-only feature (matches repo norms — docs
  have no unit suite today).
- Manual: load a page, click Copy page → paste shows the page Markdown; click an
  AgentPrompt Copy → paste shows the prompt text; Open-in-Claude opens with the
  prompt pre-filled.

## Alternatives considered

- **Dedicated `/prompts` gallery page** instead of inline blocks — rejected earlier
  by the user; inline keeps prompts in context next to the human docs.
- **CLI scaffold (`create-nadle --ai`)** — the Nx approach (`npx nx
  configure-ai-agents`). Most "magic" but the largest build (create-nadle work, an
  AGENTS.md template, cross-tool support). Deferred to a follow-up issue; the
  copy-page + prompt blocks deliver the agent on-ramp with zero new runtime tooling.
- **Tabbed "Agent prompt / Commands" block** (mockup B) — rejected: the user wants
  agent-instruction prompts, not raw command duplication; the page already shows
  runnable commands in normal code fences.

## Out of scope (future)

- `create-nadle --ai` / AGENTS.md scaffolding command (separate issue).
- An MCP server for nadle (Nx ships one; far larger, separate effort).
- Auto-linting prompts against the live CLI surface.
