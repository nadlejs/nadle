import Path from "node:path";
import Fs from "node:fs";

import { defineConfig, type DefaultTheme } from "vitepress";

import sidebar from "./sidebar.json" with { type: "json" };

/** Written by the prepareAPIMarkdown task; absent until the API pages have been generated. */
function readApiSidebar(): DefaultTheme.SidebarItem[] {
	const file = Path.join(import.meta.dirname, "api-sidebar.json");

	return Fs.existsSync(file) ? JSON.parse(Fs.readFileSync(file, "utf-8")) : [];
}

/** Docusaurus (github-slugger) anchors: keeps leading dashes and digits, e.g. "--exclude". */
function docusaurusSlugify(text: string): string {
	return text
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "")
		.replace(/ /g, "-");
}

export default defineConfig({
	base: "/",
	lang: "en",
	title: "Nadle",
	// Emits /docs/<page> without an extension, the URL scheme of the Docusaurus site.
	cleanUrls: true,
	srcExclude: ["README.md", "scripts/**"],
	sitemap: { hostname: "https://nadle.dev" },
	markdown: { anchor: { slugify: docusaurusSlugify } },
	themeConfig: {
		sidebar: [...sidebar, ...readApiSidebar()],
		search: { provider: "local" },
		nav: [
			{ text: "Docs", link: "/docs/introduction" },
			{ text: "Blog", link: "/blog/release-v0-5-0" }
		]
	}
});
