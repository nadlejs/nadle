/* eslint-disable perfectionist/sort-objects */
import Path from "node:path";
import Fs from "node:fs/promises";

import { defineConfig, type DefaultTheme } from "vitepress";

import sidebar from "./sidebar.json" with { type: "json" };

/** Written by the prepareAPIMarkdown task; absent until the API pages have been generated. */
async function readApiSidebar(): Promise<DefaultTheme.SidebarItem[]> {
	const file = Path.join(import.meta.dirname, "api-sidebar.json");

	return JSON.parse(await Fs.readFile(file, "utf-8").catch(() => "[]"));
}

const apiSidebar = await readApiSidebar();

/** Docusaurus (github-slugger) anchors: keeps leading dashes and digits, e.g. "--exclude". */
function docusaurusSlugify(text: string): string {
	return text
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "")
		.replace(/ /g, "-");
}

const SITE_URL = "https://nadle.dev";
const SITE_DESCRIPTION = "A type-safe, Gradle-inspired task runner for Node.js. Sharp tasks. Fast builds.";
const SOCIAL_CARD_URL = `${SITE_URL}/img/nadle-social-card.png`;
const DEFAULT_KEYWORDS = "task runner, Node.js, TypeScript, build tool, monorepo, Gradle, nadle";
const GTAG_ID = "G-GSB7HYN9PC";

const structuredData = {
	"@context": "https://schema.org",
	"@graph": [
		{ name: "Nadle", url: SITE_URL, "@type": "WebSite" },
		{
			name: "Nadle",
			url: SITE_URL,
			"@type": "Organization",
			logo: `${SITE_URL}/img/logo.svg`,
			sameAs: ["https://github.com/nadlejs/nadle"]
		},
		{
			name: "Nadle",
			url: SITE_URL,
			description: SITE_DESCRIPTION,
			"@type": "SoftwareApplication",
			operatingSystem: "Cross-platform",
			offers: { "@type": "Offer", price: "0" },
			applicationCategory: "DeveloperApplication"
		}
	]
};

function pageUrl(relativePath: string): string {
	const path = relativePath.replace(/\.md$/, "").replace(/(^|\/)index$/, "$1");

	return `${SITE_URL}/${path}`;
}

export default defineConfig({
	base: "/",
	lang: "en",
	title: "Nadle",
	// Emits /docs/<page> without an extension, the URL scheme of the Docusaurus site.
	cleanUrls: true,
	description: SITE_DESCRIPTION,
	srcExclude: ["README.md", "scripts/**"],
	sitemap: { hostname: "https://nadle.dev" },
	markdown: { anchor: { slugify: docusaurusSlugify } },
	themeConfig: {
		logo: "/img/logo.svg",
		socialLinks: [{ icon: "github", link: "https://github.com/nadlejs/nadle" }],
		sidebar: [...sidebar, ...apiSidebar],
		search: { provider: "local" },
		nav: [
			{ text: "Docs", link: "/docs/introduction" },
			{ text: "Blog", link: "/blog/" },
			{ text: "Spec", link: "/spec/", target: "_self" }
		]
	},
	transformHead({ pageData }) {
		const { frontmatter, relativePath } = pageData;
		const keywords: unknown = frontmatter["keywords"];
		const url = pageUrl(relativePath);

		return [
			["meta", { name: "keywords", content: Array.isArray(keywords) ? keywords.join(", ") : DEFAULT_KEYWORDS }],
			["meta", { property: "og:url", content: url }],
			["link", { rel: "canonical", href: url }]
		];
	},
	head: [
		["link", { rel: "icon", href: "/img/favicon.ico" }],
		["link", { rel: "alternate", type: "application/rss+xml", title: "Nadle Blog", href: "/rss.xml" }],
		["link", { rel: "preconnect", href: "https://www.googletagmanager.com" }],
		["link", { rel: "dns-prefetch", href: "https://ghbtns.com" }],
		["script", { async: "", src: `https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}` }],
		[
			"script",
			{},
			`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${GTAG_ID}', { anonymize_ip: true });`
		],
		["script", { type: "application/ld+json" }, JSON.stringify(structuredData)],
		["meta", { name: "author", content: "Nadle team" }],
		["meta", { name: "twitter:card", content: "summary_large_image" }],
		["meta", { property: "og:type", content: "website" }],
		["meta", { property: "og:site_name", content: "Nadle" }],
		["meta", { property: "og:image", content: SOCIAL_CARD_URL }],
		["meta", { name: "twitter:image", content: SOCIAL_CARD_URL }]
	]
});
