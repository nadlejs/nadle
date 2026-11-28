# docs-next

In-progress replacement for the Docusaurus site in `packages/docs`, built with VitePress.
It is not deployed and not part of the root `build` or `check` graph; nadle.dev still serves `packages/docs`.

```bash
pnpm exec nadle packages:docs-next:dev        # serve with hot reload
pnpm exec nadle packages:docs-next:buildSite  # build, then check the output
```

VitePress runs on vite 5 here (see the `vitepress>vite` override in `pnpm-workspace.yaml`): under the repo-wide
vite override its build exits 0 but omits the per-page chunks. `scripts/check-chunks.ts` fails the build if a page
references a JS file that was not emitted.
