import Path from "node:path";
import Fs from "node:fs/promises";

const distDir = Path.join(import.meta.dirname, "..", ".vitepress", "dist");
const SCRIPT_REFERENCE = /(?:href|src)="(\/[^"]+\.js)"/g;

/**
 * Guards against a bundler that silently ignores the plugin writes VitePress uses to emit the
 * per-page chunks: the build exits 0 while every page references a file that does not exist.
 */
async function findMissingChunks(): Promise<{ pages: number; missing: string[] }> {
	const entries = await Fs.readdir(distDir, { recursive: true });
	const pages = entries.filter((entry) => entry.endsWith(".html"));
	const missing = new Set<string>();

	for (const page of pages) {
		const html = await Fs.readFile(Path.join(distDir, page), "utf-8");

		for (const [, reference] of html.matchAll(SCRIPT_REFERENCE)) {
			const exists = await Fs.access(Path.join(distDir, reference)).then(
				() => true,
				() => false
			);

			if (!exists) {
				missing.add(`${page} -> ${reference}`);
			}
		}
	}

	return { pages: pages.length, missing: [...missing] };
}

const { pages, missing } = await findMissingChunks();

if (pages === 0 || missing.length > 0) {
	console.error(pages === 0 ? "No HTML pages found in the build output." : `Referenced JS chunks were not emitted:\n${missing.join("\n")}`);
	process.exitCode = 1;
} else {
	console.log(`Checked ${pages} pages: every referenced JS chunk exists.`);
}
