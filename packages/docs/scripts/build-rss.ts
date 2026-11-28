import Path from "node:path";
import Fs from "node:fs/promises";

import { SITE_URL, readPage, packageDir } from "./page-source.js";

const FEED_TITLE = "Nadle Blog";
const FEED_DESCRIPTION = "Keep up to date with Nadle releases, features, and tips.";

const escapeXml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function readPosts() {
	const blogDir = Path.join(packageDir, "blog");
	const files = (await Fs.readdir(blogDir)).filter((name) => name.endsWith(".md") && name !== "index.md");
	const posts = await Promise.all(
		files.map(async (name) => {
			const { frontmatter } = await readPage(Path.join(blogDir, name));
			const slug = name.replace(/\.md$/, "");

			return { slug, title: frontmatter.title ?? slug, date: new Date(frontmatter.date ?? 0), description: frontmatter.description ?? "" };
		})
	);

	return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function renderItem(post: Awaited<ReturnType<typeof readPosts>>[number]): string {
	const url = `${SITE_URL}/blog/${post.slug}`;

	return [
		"\t\t<item>",
		`\t\t\t<title>${escapeXml(post.title)}</title>`,
		`\t\t\t<link>${url}</link>`,
		`\t\t\t<guid>${url}</guid>`,
		`\t\t\t<pubDate>${post.date.toUTCString()}</pubDate>`,
		`\t\t\t<description>${escapeXml(post.description)}</description>`,
		"\t\t</item>"
	].join("\n");
}

async function main() {
	const posts = await readPosts();
	const xml = [
		'<?xml version="1.0" encoding="utf-8"?>',
		'<rss version="2.0">',
		"\t<channel>",
		`\t\t<title>${FEED_TITLE}</title>`,
		`\t\t<link>${SITE_URL}/blog</link>`,
		`\t\t<description>${FEED_DESCRIPTION}</description>`,
		"\t\t<language>en</language>",
		...(posts.length > 0 ? [`\t\t<lastBuildDate>${posts[0].date.toUTCString()}</lastBuildDate>`] : []),
		...posts.map(renderItem),
		"\t</channel>",
		"</rss>",
		""
	].join("\n");

	await Fs.mkdir(Path.join(packageDir, "public"), { recursive: true });
	await Fs.writeFile(Path.join(packageDir, "public", "rss.xml"), xml, "utf-8");
	console.log(`RSS feed generated with ${posts.length} post(s).`);
}

main().catch((error) => {
	console.error("Error building the RSS feed.", error);
	// eslint-disable-next-line n/no-process-exit
	process.exit(1);
});
