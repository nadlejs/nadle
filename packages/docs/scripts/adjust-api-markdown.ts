import Path from "node:path";
import Fs from "node:fs/promises";

import { glob } from "glob";

const rootDoc = Path.join(import.meta.dirname, "..");

const apiDocPath = Path.join(rootDoc, "docs", "api");
const SIDEBAR_FILE = Path.join(rootDoc, ".vitepress", "api-sidebar.json");
const README_FILE_NAME = "README.md";
const INDEX_FILE_NAME = "index.md";
const API_URL_PREFIX = "/docs/api";

interface SidebarItem {
	text: string;
	link?: string;
	collapsed?: boolean;
	items?: SidebarItem[];
}

const toLabel = (dirName: string) =>
	dirName
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

async function stripBreadcrumbs() {
	for (const entry of await glob("**/*.md", { cwd: apiDocPath })) {
		const path = Path.join(apiDocPath, entry);
		const content = await Fs.readFile(path, "utf-8");

		await Fs.writeFile(
			path,
			content
				.replace(/\[Nadle]\((?:\.\.\/)+README\.md\) \/ (\[index]\((\.\.\/)+README\.md\))/, (g) => {
					const segment = g.split("/ [index]")[1];

					return `[Nadle]${segment}`;
				})
				.replace(/\[\*\*Nadle\*\*]\((\.\.\/)+README\.md\)/, ""),
			"utf-8"
		);
	}
}

/** Renames every README.md to index.md and points links at the renamed pages. */
async function renameReadmesToIndex() {
	for (const entry of await glob("**/*.md", { cwd: apiDocPath })) {
		const path = Path.join(apiDocPath, entry);
		const content = await Fs.readFile(path, "utf-8");

		const relinked = content.replace(/\]\(((?:\.\.?\/|[\w-]+\/)*)README\.md\)/g, (match, prefix: string) => {
			const target = Path.resolve(Path.dirname(path), prefix);
			// The removed top-level README is the "Nadle" breadcrumb; it now means the API index.
			const page = target === apiDocPath ? Path.join(apiDocPath, "index") : target;

			return `](${Path.posix.join(API_URL_PREFIX, Path.relative(apiDocPath, page).split(Path.sep).join("/"))}/)`;
		});

		await Fs.writeFile(path, relinked, "utf-8");

		if (Path.basename(path) === README_FILE_NAME) {
			await Fs.rename(path, Path.join(Path.dirname(path), INDEX_FILE_NAME));
		}
	}
}

async function buildSidebarItems(dir: string): Promise<SidebarItem[]> {
	const entries = (await Fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
	const items: SidebarItem[] = [];

	for (const entry of entries) {
		const path = Path.join(dir, entry.name);
		const url = `${API_URL_PREFIX}/${Path.relative(apiDocPath, path).split(Path.sep).join("/")}`;

		if (entry.isDirectory()) {
			const hasIndex = await Fs.access(Path.join(path, INDEX_FILE_NAME)).then(
				() => true,
				() => false
			);

			items.push({ collapsed: true, text: toLabel(entry.name), items: await buildSidebarItems(path), ...(hasIndex && { link: `${url}/` }) });
		} else if (entry.name !== INDEX_FILE_NAME && entry.name.endsWith(".md")) {
			items.push({ link: url.replace(/\.md$/, ""), text: entry.name.replace(/\.md$/, "") });
		}
	}

	return items;
}

async function writeSidebar() {
	const sidebar: SidebarItem = {
		collapsed: true,
		text: "API Reference",
		link: `${API_URL_PREFIX}/index/`,
		items: await buildSidebarItems(Path.join(apiDocPath, "index"))
	};
	await Fs.writeFile(SIDEBAR_FILE, JSON.stringify([sidebar], null, "\t") + "\n", "utf-8");
}

async function main() {
	await Fs.rm(Path.join(apiDocPath, README_FILE_NAME), { force: true });
	await stripBreadcrumbs();

	await renameReadmesToIndex();
	await writeSidebar();

	const indexPath = Path.join(apiDocPath, "index", INDEX_FILE_NAME);
	const indexFileLines = (await Fs.readFile(indexPath, "utf-8")).split("\n");
	const h1IndexLine = indexFileLines.indexOf(`# index`);

	if (h1IndexLine !== -1) {
		const adjustedContent = [`---`, `title: "API Reference"`, `---`, ...indexFileLines.slice(h1IndexLine + 1)].join("\n");
		await Fs.writeFile(indexPath, adjustedContent, "utf-8");
	}
}

main()
	.then(() => {
		console.log("API markdown files adjusted successfully.");
	})
	.catch((error) => {
		console.error("Error adjusting API markdown files.", error);
		// eslint-disable-next-line n/no-process-exit
		process.exit(1);
	});
