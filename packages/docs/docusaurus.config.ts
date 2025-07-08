import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { themes as prismThemes } from "prism-react-renderer";

import NadlePackageJson from "../nadle/package.json";

const GITHUB_REPO_URL = "https://github.com/nadlejs/nadle";

const config: Config = {
	title: "Nadle",
	favicon: "img/favicon.ico",
	tagline: "A modern, type-safe task runner for Node.js",

	baseUrl: "/",
	projectName: "nadle",
	url: "https://nadle.dev",
	organizationName: "nadlejs",

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	i18n: {
		locales: ["en"],
		defaultLocale: "en"
	},

	plugins: ["./src/plugins/tailwind-config.ts"],
	presets: [
		[
			"classic",
			{
				blog: false,
				theme: {
					customCss: "./src/css/custom.css"
				},
				gtag: {
					anonymizeIP: true,
					trackingID: "G-GSB7HYN9PC"
				},
				docs: {
					sidebarPath: "./sidebars.ts",
					editUrl: `${GITHUB_REPO_URL}/tree/main/packages/docs/`
				}
			} satisfies Preset.Options
		]
	],

	themeConfig: {
		image: "img/nadle-social-card.jpg",
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula
		},
		algolia: {
			insights: false,
			indexName: "nadle",
			appId: "N3MF5K9FHG",
			searchParameters: {},
			contextualSearch: true,
			searchPagePath: "search",
			apiKey: "a889ea985571abd223e1ffc5195e1769"
		},
		navbar: {
			title: "Nadle",
			logo: {
				alt: "Nadle Logo",
				src: "img/logo.svg"
			},
			items: [
				{
					label: "Docs",
					position: "left",
					type: "docSidebar",
					sidebarId: "docsSidebar"
				},
				{
					position: "right",
					label: NadlePackageJson.version,
					className: "navbar-version-label",
					href: `${GITHUB_REPO_URL}/releases/tag/v${NadlePackageJson.version}`
				},
				{
					position: "right",
					href: GITHUB_REPO_URL,
					className: "header-github-link",
					"aria-label": "GitHub repository"
				}
			]
		},
		footer: {
			style: "dark",
			copyright: `Copyright © ${new Date().getFullYear()} Nadle. Built with Docusaurus.`,
			links: [
				{
					title: "Documentation",
					items: [
						{
							label: "Introduction",
							to: "/docs/introduction"
						},
						{
							label: "Installation",
							to: "/docs/getting-started/installation"
						},
						{
							label: "Features",
							to: "/docs/getting-started/features"
						}
					]
				},
				{
					title: "More",
					items: [
						{
							label: "GitHub",
							href: GITHUB_REPO_URL
						}
					]
				}
			]
		}
	} satisfies Preset.ThemeConfig
};

export default config;
