/* eslint-disable perfectionist/sort-objects */
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
				blog: {
					path: "blog",
					postsPerPage: 5,
					blogSidebarCount: "ALL",
					blogTitle: "Nadle blog",
					blogSidebarTitle: "All our posts",
					blogDescription: "Read blog posts about Nadle from the team",
					feedOptions: {
						xslt: true,
						type: "all",
						copyright: `Copyright © ${new Date().getFullYear()} Nadle team`,
						description: "Keep up to date with upcoming Docusaurus releases and articles by following our feed!"
					},
					editUrl: ({ blogPath, blogDirPath }) => {
						return `${GITHUB_REPO_URL}/edit/main/packages/docs/${blogDirPath}/${blogPath}`;
					}
				},
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
			appId: "AE5FVNEEID",
			contextualSearch: true,
			searchPagePath: "search",
			indexName: "Nadle Documentation Website",
			apiKey: "15c38b0ee7e6e3d2f082f87568cbb4fa"
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
				{ to: "blog", label: "Blog", position: "left" },
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
