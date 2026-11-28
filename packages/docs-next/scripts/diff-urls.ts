import { newBuildDir, oldBuildDir, readSitemapPaths } from "./site-urls.js";

/** URLs the migration plan drops on purpose; they get redirects at cutover. */
const DROPPED = [/^\/search$/, /^\/blog\/archive$/, /^\/blog\/tags(\/|$)/, /^\/blog\/authors(\/|$)/];
/** URLs not built here yet: the generated API reference, and the blog index. */
const PENDING = [/^\/docs\/api\//, /^\/blog$/];

const matchesAny = (patterns: RegExp[], path: string) => patterns.some((pattern) => pattern.test(path));
const list = (title: string, paths: string[]) => console.log(`${title} (${paths.length})${paths.map((path) => `\n  ${path}`).join("")}`);

const [oldPaths, newPaths] = await Promise.all([readSitemapPaths(oldBuildDir), readSitemapPaths(newBuildDir)]);
const oldSet = new Set(oldPaths);
const newSet = new Set(newPaths);
const missing = oldPaths.filter((path) => !newSet.has(path));
const added = newPaths.filter((path) => !oldSet.has(path));
const unexpected = missing.filter((path) => !matchesAny(DROPPED, path) && !matchesAny(PENDING, path));

console.log(`Old sitemap: ${oldPaths.length} URLs, new sitemap: ${newPaths.length} URLs`);
list(
	"Dropped on purpose",
	missing.filter((path) => matchesAny(DROPPED, path))
);
list(
	"Pending, not built yet",
	missing.filter((path) => matchesAny(PENDING, path))
);
list("Missing from the new site", unexpected);
list("Only in the new site", added);

if (unexpected.length > 0 || added.length > 0) {
	process.exitCode = 1;
}
