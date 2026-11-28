import Path from "node:path";
import Fs from "node:fs/promises";

export const oldBuildDir = Path.join(import.meta.dirname, "..", "..", "docs", "build");
export const newBuildDir = Path.join(import.meta.dirname, "..", ".vitepress", "dist");

/** The URL paths a built site lists in its sitemap, without the origin or a trailing slash. */
export async function readSitemapPaths(buildDir: string): Promise<string[]> {
	const sitemap = await Fs.readFile(Path.join(buildDir, "sitemap.xml"), "utf-8");

	return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, location]) => new URL(location).pathname.replace(/(.)\/$/, "$1")).sort();
}
