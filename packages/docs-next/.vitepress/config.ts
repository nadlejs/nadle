import { defineConfig } from "vitepress";

import sidebar from "./sidebar.json" with { type: "json" };

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
	// The API reference pages are generated in a later step; drop this once they are built here.
	ignoreDeadLinks: [/api\/index\//],
	srcExclude: ["README.md", "scripts/**"],
	sitemap: { hostname: "https://nadle.dev" },
	markdown: { anchor: { slugify: docusaurusSlugify } },
	themeConfig: {
		sidebar,
		search: { provider: "local" },
		nav: [
			{ text: "Docs", link: "/docs/introduction" },
			{ text: "Blog", link: "/blog/release-v0-5-0" }
		]
	}
});
