import Path from "node:path";
import Fs from "node:fs/promises";

import { SITE_URL, readPage, packageDir } from "./page-source.js";

const SPEC_BASE_URL = process.env["DEPLOY_PRIME_URL"] || SITE_URL;
const SITE_DESCRIPTION = "A type-safe, Gradle-inspired task runner for Node.js. Sharp tasks. Fast builds.";

interface SidebarEntry {
	text: string;
	link?: string;
	items?: SidebarEntry[];
}

interface Section {
	title: string;
	match: (link: string) => boolean;
}

// Same grouping as the llms.txt published before the VitePress move; pages outside every group are listed first.
const SECTIONS: Section[] = [
	{ title: "Docs", match: () => false },
	{ title: "Getting Started", match: (link) => link.startsWith("/docs/getting-started/") },
	{ title: "Concepts", match: (link) => link.startsWith("/docs/concepts/") },
	{ title: "Guides", match: (link) => link.startsWith("/docs/guides/") },
	{ title: "Config Reference", match: (link) => link === "/docs/config-reference" },
	{ title: "API Reference", match: (link) => link.startsWith("/docs/api/") }
];

interface Link {
	text: string;
	link: string;
}

function flatten(entries: SidebarEntry[]): Link[] {
	return entries.flatMap((entry) => [...(entry.link ? [{ text: entry.text, link: entry.link }] : []), ...flatten(entry.items ?? [])]);
}

async function readSidebar(file: string): Promise<SidebarEntry[]> {
	return JSON.parse(await Fs.readFile(Path.join(packageDir, ".vitepress", file), "utf-8"));
}

const sourceFile = (link: string) => Path.join(packageDir, link.endsWith("/") ? `${link}index` : link) + ".md";

async function main() {
	const links = flatten([...(await readSidebar("sidebar.json")), ...(await readSidebar("api-sidebar.json"))]);
	const sections = SECTIONS.map((section) => ({
		...section,
		links: links.filter((entry) => (section.title === "Docs" ? !SECTIONS.some((other) => other.match(entry.link)) : section.match(entry.link)))
	}));

	const index = ["# Nadle", "", `> ${SITE_DESCRIPTION}`, ""];
	const full = [...index];

	for (const section of sections) {
		index.push(`## ${section.title}`, "");
		full.push(`## ${section.title}`, "");

		for (const { text, link } of section.links) {
			const { body, frontmatter } = await readPage(sourceFile(link));
			const url = `${SITE_URL}${link}`;

			index.push(`- [${text}](${url})${frontmatter.description ? `: ${frontmatter.description}` : ""}`);
			full.push(`### ${text}`, "", `Source: ${url}`, "", body, "");
		}

		index.push("");
	}

	index.push(
		"## Optional",
		"",
		`- [Specification](${SPEC_BASE_URL}/spec/): The language-agnostic specification, the single source of truth for Nadle behavior.`,
		""
	);

	await Fs.mkdir(Path.join(packageDir, "public"), { recursive: true });
	await Fs.writeFile(Path.join(packageDir, "public", "llms.txt"), index.join("\n"), "utf-8");
	await Fs.writeFile(Path.join(packageDir, "public", "llms-full.txt"), full.join("\n"), "utf-8");
	console.log(`llms.txt and llms-full.txt generated for ${links.length} pages.`);
}

main().catch((error) => {
	console.error("Error building llms.txt.", error);
	// eslint-disable-next-line n/no-process-exit
	process.exit(1);
});
