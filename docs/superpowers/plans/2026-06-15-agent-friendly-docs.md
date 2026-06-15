# Agent-Friendly nadle.dev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a site-wide "Copy page" (as Markdown) button to every doc page on nadle.dev, plus inline `<AgentPrompt>` blocks that copy a ready-made agent instruction on the setup/migrate/caching/plugin guides.

**Architecture:** Two independent React/MDX units in `packages/docs/src/`. `CopyPageButton` fetches the current route's generated `.md` (the llms-txt plugin emits `/docs/foo` → `/docs/foo.md` at the same path) and writes it to the clipboard, with a page-URL fallback. It's rendered above every doc article via a swizzled `theme/DocItem/Content`. `AgentPrompt` is a small MDX component (registered globally via swizzled `theme/MDXComponents`) that renders its children as a copyable prompt block. Neither depends on the other. No build-plugin changes — the `.md` sources already exist.

**Tech Stack:** Docusaurus 3, React 18, `@mdx-js/react`, TypeScript, `clsx`, Docusaurus CSS modules. Docs build/lint via the repo's `nadle` tasks; this package has no unit-test suite (verification is build + manual), matching repo norms.

**Spec:** `docs/superpowers/specs/2026-06-15-agent-friendly-docs-design.md`

**Conventions verified:** `theme/Footer/index.tsx` is already swizzled (precedent). Per-page Markdown is served at `route + ".md"` (confirmed: `/docs/why-nadle` → `build/docs/why-nadle.md`). The keyed-spec register API (post-#688) is the current API — prompts must use it.

**Build/verify note:** the self-host `nadle` runner works post-#693. Build the docs site with `pnpm nadle packages:docs:buildSite`; run the dev server with the docs package's `start` script. Run commands from the repo root.

---

## File Structure

- `packages/docs/src/components/CopyPageButton/index.tsx` — the button + copy logic (fetch `.md`, clipboard, fallback, "Copied!" state). One unit.
- `packages/docs/src/components/CopyPageButton/styles.module.css` — its styles.
- `packages/docs/src/theme/DocItem/Content/index.tsx` — swizzled wrapper that renders `<CopyPageButton/>` above the original doc content.
- `packages/docs/src/components/AgentPrompt/index.tsx` — the inline prompt block.
- `packages/docs/src/components/AgentPrompt/styles.module.css` — its styles.
- `packages/docs/src/theme/MDXComponents.tsx` — registers `AgentPrompt` globally so MDX/MD pages can use `<AgentPrompt>` without importing.
- MDX edits: `getting-started/installation.md`, a migration guide, `guides/configuring-task.md`, `guides/authoring-plugin.md` — add one `<AgentPrompt>` each.

---

## Task 1: CopyPageButton component

**Files:**
- Create: `packages/docs/src/components/CopyPageButton/index.tsx`
- Create: `packages/docs/src/components/CopyPageButton/styles.module.css`

- [ ] **Step 1: Create the styles module**

`packages/docs/src/components/CopyPageButton/styles.module.css`:
```css
.button {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.25rem 0.7rem;
	font-size: 0.8rem;
	font-weight: 600;
	color: var(--ifm-color-emphasis-800);
	background: var(--ifm-color-emphasis-100);
	border: 1px solid var(--ifm-color-emphasis-300);
	border-radius: 6px;
	cursor: pointer;
	transition: background 0.15s ease;
}
.button:hover {
	background: var(--ifm-color-emphasis-200);
}
.copied {
	color: var(--ifm-color-success);
	border-color: var(--ifm-color-success);
}
```

- [ ] **Step 2: Create the component**

`packages/docs/src/components/CopyPageButton/index.tsx`:
```tsx
import React, { useState } from "react";
import { useLocation } from "@docusaurus/router";
import styles from "./styles.module.css";

type Status = "idle" | "copied" | "linked";

export default function CopyPageButton(): React.ReactElement {
	const { pathname } = useLocation();
	const [status, setStatus] = useState<Status>("idle");

	async function handleCopy(): Promise<void> {
		const mdUrl = pathname.replace(/\/$/, "") + ".md";
		try {
			const response = await fetch(mdUrl);
			if (!response.ok) {
				throw new Error(`status ${response.status}`);
			}
			const markdown = await response.text();
			await navigator.clipboard.writeText(markdown);
			setStatus("copied");
		} catch {
			// Fallback: copy the page URL so the agent can fetch it.
			await navigator.clipboard.writeText(window.location.href);
			setStatus("linked");
		}
		setTimeout(() => setStatus("idle"), 2000);
	}

	const label = status === "copied" ? "Copied!" : status === "linked" ? "Link copied" : "Copy page";

	return (
		<button
			type="button"
			className={status === "idle" ? styles.button : `${styles.button} ${styles.copied}`}
			onClick={handleCopy}
			title="Copy this page as Markdown for an AI agent"
		>
			📋 {label}
		</button>
	);
}
```

- [ ] **Step 3: Type-check the component**

Run: `pnpm --filter @nadle/internal-docs exec tsc --noEmit` (or the docs package's typecheck script — check `packages/docs/package.json` scripts; if none, `cd packages/docs && pnpm exec tsc --noEmit`)
Expected: no type errors in the new files.

- [ ] **Step 4: Commit**

```bash
git add packages/docs/src/components/CopyPageButton
git commit -m "feat: CopyPageButton component for docs"
```

---

## Task 2: Swizzle DocItem/Content to render the button

**Files:**
- Create: `packages/docs/src/theme/DocItem/Content/index.tsx`

- [ ] **Step 1: Create the swizzled wrapper**

`packages/docs/src/theme/DocItem/Content/index.tsx`:
```tsx
import React from "react";
import Content from "@theme-original/DocItem/Content";
import type ContentType from "@theme/DocItem/Content";
import type { WrapperProps } from "@docusaurus/types";
import CopyPageButton from "@site/src/components/CopyPageButton";
import styles from "./styles.module.css";

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): React.ReactElement {
	return (
		<>
			<div className={styles.actions}>
				<CopyPageButton />
			</div>
			<Content {...props} />
		</>
	);
}
```

- [ ] **Step 2: Create its styles**

`packages/docs/src/theme/DocItem/Content/styles.module.css`:
```css
.actions {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 0.5rem;
}
```

- [ ] **Step 3: Build the site to verify the swizzle resolves**

Run: `pnpm nadle packages:docs:buildSite`
Expected: build succeeds; no "component not found" / swizzle errors. (`@theme-original/DocItem/Content` must resolve — it's a standard Docusaurus theme component.)

- [ ] **Step 4: Manually verify in the dev server**

Run: `cd packages/docs && pnpm start` (or the package's dev script), open any `/docs/*` page.
Expected: a "Copy page" button appears at the top-right of the article. Click it → paste into an editor → the page's Markdown appears. (If `.md` 404s in dev, the fallback copies the URL — that's acceptable; the `.md` is generated in the production build.)

- [ ] **Step 5: Commit**

```bash
git add packages/docs/src/theme/DocItem/Content
git commit -m "feat: render Copy page button on every doc page"
```

---

## Task 3: AgentPrompt component

**Files:**
- Create: `packages/docs/src/components/AgentPrompt/index.tsx`
- Create: `packages/docs/src/components/AgentPrompt/styles.module.css`

- [ ] **Step 1: Create the styles (minimal admonition aesthetic — green left border)**

`packages/docs/src/components/AgentPrompt/styles.module.css`:
```css
.block {
	border-left: 3px solid var(--ifm-color-success);
	background: var(--ifm-color-emphasis-100);
	border-radius: 0 8px 8px 0;
	padding: 0.9rem 1rem;
	margin: 1.2rem 0;
}
.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
}
.label {
	font-size: 0.7rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: var(--ifm-color-emphasis-700);
}
.copy {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	padding: 0.2rem 0.6rem;
	font-size: 0.75rem;
	color: var(--ifm-color-success-dark);
	background: transparent;
	border: 1px solid var(--ifm-color-success);
	border-radius: 6px;
	cursor: pointer;
}
.body {
	margin: 0;
	font-family: var(--ifm-font-family-monospace);
	font-size: 0.85rem;
	line-height: 1.5;
	color: var(--ifm-color-emphasis-900);
	white-space: pre-wrap;
}
```

- [ ] **Step 2: Create the component**

`packages/docs/src/components/AgentPrompt/index.tsx`:
```tsx
import React, { useRef, useState } from "react";
import styles from "./styles.module.css";

interface AgentPromptProps {
	/** The prompt text. Provided as children so it reads naturally in MDX. */
	readonly children: React.ReactNode;
}

export default function AgentPrompt({ children }: AgentPromptProps): React.ReactElement {
	const bodyRef = useRef<HTMLParagraphElement>(null);
	const [copied, setCopied] = useState(false);

	async function handleCopy(): Promise<void> {
		const text = bodyRef.current?.textContent?.trim() ?? "";
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<div className={styles.block}>
			<div className={styles.header}>
				<span className={styles.label}>Prompt for your AI agent</span>
				<button type="button" className={styles.copy} onClick={handleCopy}>
					📋 {copied ? "Copied!" : "Copy"}
				</button>
			</div>
			<p ref={bodyRef} className={styles.body}>
				{children}
			</p>
		</div>
	);
}
```

- [ ] **Step 3: Type-check**

Run: `cd packages/docs && pnpm exec tsc --noEmit`
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/docs/src/components/AgentPrompt
git commit -m "feat: AgentPrompt inline copyable prompt component"
```

---

## Task 4: Register AgentPrompt globally for MDX

**Files:**
- Create: `packages/docs/src/theme/MDXComponents.tsx`

- [ ] **Step 1: Create the MDXComponents swizzle**

`packages/docs/src/theme/MDXComponents.tsx`:
```tsx
import MDXComponents from "@theme-original/MDXComponents";
import AgentPrompt from "@site/src/components/AgentPrompt";

export default {
	...MDXComponents,
	AgentPrompt
};
```

This makes `<AgentPrompt>` usable in any `.md`/`.mdx` page without an explicit import.

- [ ] **Step 2: Build to verify registration**

Run: `pnpm nadle packages:docs:buildSite`
Expected: build succeeds. (No page uses `<AgentPrompt>` yet, so this just verifies the swizzle resolves.)

- [ ] **Step 3: Commit**

```bash
git add packages/docs/src/theme/MDXComponents.tsx
git commit -m "feat: register AgentPrompt as a global MDX component"
```

---

## Task 5: Add AgentPrompt blocks to the four scenario pages

**Files:**
- Modify: `packages/docs/docs/getting-started/installation.md`
- Modify: `packages/docs/docs/guides/configuring-task.md`
- Modify: `packages/docs/docs/guides/authoring-plugin.md`
- Modify: the migration guide page — if one exists under `packages/docs/docs/`, use it; if not, add the block to `getting-started/installation.md` under a "Migrating an existing project" subsection and note that issue #650 (migration guides) will expand it.

- [ ] **Step 1: Find the exact insertion points**

Run: `cd packages/docs && grep -rn "^# \|^## " docs/getting-started/installation.md docs/guides/configuring-task.md docs/guides/authoring-plugin.md`
Expected: lists the headings so you place each block under the most relevant section. Also run `ls docs/guides docs/getting-started` to confirm whether a migration page exists.

- [ ] **Step 2: Add the setup prompt to `installation.md`**

After the install/verify section, insert:
```mdx
<AgentPrompt>
Set up Nadle in this repository. Install `nadle` as a dev dependency, create a `nadle.config.ts` at the project root that registers a `build` task running `tsc` and a `test` task that depends on `build`, then run `nadle build` to verify it works. Use the keyed task spec form: `tasks.register("build", { run: ExecTask, options: { command: "tsc" } })`.
</AgentPrompt>
```

- [ ] **Step 3: Add the migration prompt**

On the migration page (or the installation migration subsection):
```mdx
<AgentPrompt>
Migrate this repository's npm scripts to Nadle. For each script in package.json, register an equivalent Nadle task in `nadle.config.ts` using the keyed spec form (`tasks.register("name", { run: ExecTask, options: { command, args } })`), preserve the original behavior, wire up `dependsOn` where one script calls another, and leave the npm scripts in place until I confirm the Nadle tasks work.
</AgentPrompt>
```

- [ ] **Step 4: Add the caching prompt to `configuring-task.md`**

Under the inputs/outputs/caching section:
```mdx
<AgentPrompt>
Add caching to my Nadle `build` task so it is skipped when its inputs are unchanged. Declare `inputs` for the source files and config it reads, and `outputs` for the directory it produces, using `Inputs.files(...)` / `Outputs.dirs(...)` in the task's keyed spec. Then explain how to verify a cache hit.
</AgentPrompt>
```

- [ ] **Step 5: Add the plugin prompt to `authoring-plugin.md`**

Under the plugin-authoring intro:
```mdx
<AgentPrompt>
Scaffold a Nadle plugin in this repository using `definePlugin`. It should contribute one custom task (built with `defineTask`) and one reporter, and export the plugin so it can be applied with `use(...)` in `nadle.config.ts`. Follow the keyed task spec API.
</AgentPrompt>
```

- [ ] **Step 6: Build + link check**

Run: `pnpm nadle packages:docs:buildSite`
Then: `pnpm nadle checkLinks`
Expected: build succeeds (the global `<AgentPrompt>` renders on all four pages); no broken links/anchors.

- [ ] **Step 7: Manually verify**

Run the dev server, open each of the four pages, confirm the green prompt block renders and its Copy button copies the prompt text (paste to check).

- [ ] **Step 8: Commit**

```bash
git add packages/docs/docs
git commit -m "docs: add agent-prompt blocks to setup, migrate, caching, plugin guides"
```

---

## Task 6: Final verification

- [ ] **Step 1: Full docs build + checks**

Run: `pnpm nadle packages:docs:buildSite`
Run: `pnpm nadle checkLinks`
Run: `cd packages/docs && pnpm exec tsc --noEmit`
Run: `pnpm exec eslint packages/docs/src --quiet`
Expected: all green. Fix any prettier/eslint drift on the new files (`pnpm exec prettier --write packages/docs/src`).

- [ ] **Step 2: Manual smoke test**

Dev server: confirm (a) every doc page shows "Copy page" and it copies the page Markdown in a production build (`buildSite` then serve the `build/` dir, since `.md` files only exist after build), (b) the four pages show working AgentPrompt blocks.

- [ ] **Step 3: Commit any cleanup**

```bash
git add -A
git commit -m "chore: lint/format agent-docs components"
```

---

## Self-Review

- **Spec coverage:** Component 1 (Copy page) → Tasks 1-2. Component 2 (AgentPrompt) → Tasks 3-4. The 4 scenarios → Task 5. Error handling (clipboard fail, `.md` 404 → URL fallback) → Task 1 Step 2. Site-wide via swizzle → Task 2. Global MDX registration → Task 4. Build/checkLinks/manual verification → Task 6. No open-in-assistant (dropped from spec) — correctly absent.
- **Placeholder scan:** the migration-page target is conditional (use existing page or add a subsection) — resolved with an explicit either/or instruction + the #650 note, not a TBD. All code blocks are complete.
- **Type consistency:** `CopyPageButton` default export ← imported in `DocItem/Content`; `AgentPrompt` default export ← imported in `MDXComponents`; prop name `children` consistent. CSS module class names (`button`/`copied`, `block`/`header`/`label`/`copy`/`body`, `actions`) match between each `.tsx` and its `.module.css`.
- **Known unknown for the implementer:** the docs package's exact typecheck/start script names — Task 1 Step 3 / Task 2 Step 4 say to check `packages/docs/package.json` scripts (don't assume). The `@nadle/internal-docs` filter name is a guess; verify the real package name.
