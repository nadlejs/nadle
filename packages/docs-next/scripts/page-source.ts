import Path from "node:path";
import Fs from "node:fs/promises";

export const SITE_URL = "https://nadle.dev";

export interface Frontmatter {
	date?: string;
	title?: string;
	description?: string;
}

export interface Page {
	body: string;
	frontmatter: Frontmatter;
}

/** Reads the flat `key: value` lines of the frontmatter, which is all these pages use. */
export function parsePage(source: string): Page {
	const match = /^---\n([\s\S]*?)\n---\n?/.exec(source);
	const frontmatter: Record<string, string> = {};

	for (const line of (match?.[1] ?? "").split("\n")) {
		const pair = /^([A-Za-z][\w-]*):\s*(.+)$/.exec(line);

		if (pair) {
			frontmatter[pair[1]] = pair[2].replace(/^(["'])(.*)\1$/, "$2");
		}
	}

	return { frontmatter, body: source.slice(match?.[0].length ?? 0).trim() };
}

export async function readPage(file: string): Promise<Page> {
	return parsePage(await Fs.readFile(file, "utf-8"));
}

export const packageDir = Path.join(import.meta.dirname, "..");
