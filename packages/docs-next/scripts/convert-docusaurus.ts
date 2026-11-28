import Path from "node:path";
import Fs from "node:fs/promises";

import { convertSidebar } from "./convert-sidebar.js";
import { convertMarkdown } from "./convert-markdown.js";

const docsPackage = Path.join(import.meta.dirname, "..", "..", "docs");
const outRoot = Path.join(import.meta.dirname, "..");
const problems: string[] = [];

async function listPages(directory: string, skip: string[] = []): Promise<string[]> {
	const entries = await Fs.readdir(Path.join(docsPackage, directory), { recursive: true });

	return entries
		.filter((entry) => /\.mdx?$/.test(entry) && !skip.some((prefix) => entry.startsWith(prefix)))
		.sort()
		.map((entry) => Path.join(directory, entry));
}

async function writeConverted(source: string, target: string): Promise<void> {
	const content = await Fs.readFile(Path.join(docsPackage, source), "utf-8");

	await Fs.mkdir(Path.dirname(Path.join(outRoot, target)), { recursive: true });
	await Fs.writeFile(
		Path.join(outRoot, target),
		convertMarkdown(content, (problem) => problems.push(`${source}: ${problem}`))
	);
}

/** Drops previously converted pages (not the generated api folder) so removed pages do not linger. */
async function clearConvertedDocs(): Promise<void> {
	const entries = await Fs.readdir(Path.join(outRoot, "docs")).catch(() => []);

	await Promise.all(
		entries.filter((entry) => entry !== "api").map((entry) => Fs.rm(Path.join(outRoot, "docs", entry), { force: true, recursive: true }))
	);
}

/** A post keeps its old URL through its file name: Docusaurus took the URL from the slug frontmatter. */
async function convertBlog(): Promise<void> {
	for (const post of await listPages("blog")) {
		const slug = /^slug: (.+)$/m.exec(await Fs.readFile(Path.join(docsPackage, post), "utf-8"))?.[1];

		if (slug) {
			await writeConverted(post, Path.join("blog", `${slug}.md`));
		} else {
			problems.push(`${post}: no slug frontmatter`);
		}
	}
}

await clearConvertedDocs();

for (const page of await listPages("docs", ["api"])) {
	await writeConverted(page, page.replace(/\.mdx$/, ".md"));
}

await convertBlog();

const sidebar = await convertSidebar(Path.join(docsPackage, "sidebars.ts"), Path.join(docsPackage, "docs"));

await Fs.writeFile(Path.join(outRoot, ".vitepress", "sidebar.json"), `${JSON.stringify(sidebar, null, "\t")}\n`);

if (problems.length > 0) {
	console.error(`Not converted:\n${problems.join("\n")}`);
	process.exitCode = 1;
}
