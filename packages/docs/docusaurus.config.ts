import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const GITHUB_REPO_URL = "https://github.com/nam-hle/nadle";

const config: Config = {
	title: "Nadle",
	favicon: "img/favicon.ico",
	tagline: "A modern, type-safe task runner for Node.js",

	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/",
	// Set the production url of your site here
	url: "https://nadle.vercel.app",

	projectName: "nadle", // Usually your repo name.
	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "nadle", // Usually your GitHub org/user name.

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		locales: ["en"],
		defaultLocale: "en"
	},

	presets: [
		[
			"classic",
			{
				blog: false,
				theme: {
					customCss: "./src/css/custom.css"
				},
				docs: {
					sidebarPath: "./sidebars.ts",
					// Please change this to your repo.
					// Remove this to remove the "edit this page" links.
					editUrl: `${GITHUB_REPO_URL}/tree/main/packages/docs/`
				}
			} satisfies Preset.Options
		]
	],

	themeConfig: {
		// Replace with your project's social card
		image: "img/nadle-social-card.jpg",
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula
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
					sidebarId: "tutorialSidebar"
				},
				{
					label: "GitHub",
					position: "right",
					href: GITHUB_REPO_URL
				}
			]
		},
		footer: {
			style: "dark",
			copyright: `Copyright © ${new Date().getFullYear()} Nadle. Built with Docusaurus.`,
			links: [
				{
					title: "Docs",
					items: [
						{
							label: "Introduction",
							to: "/docs/introduction"
						},
						{
							label: "Getting Started",
							to: "/docs/getting-started/installation"
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
