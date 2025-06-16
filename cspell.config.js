import { globSync } from "glob";
import Path from "node:path";
import Fs from "node:fs";

function extractLibraryNames() {
	const packageNames = new Set();

	for (const entry of globSync("**/package.json", {
		ignore: "node_modules/**"
	})) {
		const packageJson = JSON.parse(Fs.readFileSync(Path.resolve(entry), "utf-8"));
		for (const depType of ["dependencies", "devDependencies", "peerDependencies"]) {
			if (packageJson[depType]) {
				for (const depName of Object.keys(packageJson[depType])) {
					packageNames.add(depName);
				}
			}
		}
	}

	return Array.from(packageNames);
}

const config = {
	language: "en",
	words: ["Cancelation", "SCROLLBACK", "Vitest", "indegree", "nodir", "npmjs", "softwareTerms", ...extractLibraryNames()],
	ignoreWords: ["Hoang"],
	ignorePaths: [
		"**/lib",
		"**/*.svg",
		"pnpm-lock.yaml",
		"*.vitest-temp.json",
		"./packages/docs/**",
		".github/workflows/**",
		"./packages/**/package.json",
		"packages/nadle/test/resolve-task.test.ts"
	]
};

export default config;
