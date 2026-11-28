import Path from "node:path";
import Fs from "node:fs/promises";

import { newBuildDir, oldBuildDir, readSitemapPaths } from "./site-urls.js";

const HEADING_ID = /<h[2-6]\b[^>]*\sid="([^"]+)"/g;

const htmlFile = (buildDir: string, urlPath: string, cleanUrls: boolean) =>
	Path.join(buildDir, urlPath.endsWith("/") || !cleanUrls ? Path.join(urlPath, "index.html") : `${urlPath}.html`);

async function readAnchors(file: string): Promise<string[] | undefined> {
	const html = await Fs.readFile(file, "utf-8").catch(() => undefined);

	return html === undefined ? undefined : [...html.matchAll(HEADING_ID)].map(([, id]) => id);
}

let anchors = 0;
let compared = 0;
const lost: string[] = [];

for (const urlPath of await readSitemapPaths(oldBuildDir)) {
	const [before, after] = await Promise.all([readAnchors(htmlFile(oldBuildDir, urlPath, false)), readAnchors(htmlFile(newBuildDir, urlPath, true))]);

	if (before && after) {
		compared++;
		anchors += before.length;
		lost.push(...before.filter((id) => !after.includes(id)).map((id) => `${urlPath}#${id}`));
	}
}

console.log(`Compared ${compared} pages present in both builds: ${anchors} old anchors, ${lost.length} missing in the new build`);

if (lost.length > 0) {
	console.log(lost.join("\n"));
	process.exitCode = 1;
}
