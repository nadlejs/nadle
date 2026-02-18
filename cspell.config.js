// eslint-disable-next-line no-restricted-imports -- readFileSync requires node:fs
import Fs from "node:fs";
import Path from "node:path";

import { globSync } from "glob";

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

					if (depName.includes("@")) {
						const [scope, name] = depName.split("/");
						packageNames.add(scope.slice(1));
						packageNames.add(name);
					}
				}
			}
		}
	}

	return Array.from(packageNames);
}

const config = {
	language: "en",
	ignoreWords: ["Hoang"],
	words: [
		"Cancelation",
		"Dogfooding",
		"SCROLLBACK",
		"Turborepo",
		"Vitest",
		"Wireit",
		"indegree",
		"nodir",
		"reinit",
		"npmjs",
		"softwareTerms",
		"Sonarqube",
		"speckit",
		"transpiles",
		"Workspaced",
		"Uncategorized",
		...extractLibraryNames()
	],
	ignorePaths: [
		"Central_Europe_Itinerary_*.md",
		"**/lib",
		"**/*.svg",
		"pnpm-lock.yaml",
		"*.vitest-temp.json",
		".claude/**",
		".specify/scripts/**",
		".specify/templates/**",
		"./packages/docs/**",
		".github/workflows/**",
		"./packages/**/package.json",
		"packages/nadle/test/unit/task-input-resolver.test.ts",
		"packages/nadle/test/features/workspaces/tasks.test.ts",
		"packages/nadle/test/__snapshots__/features/workspaces/tasks.test.ts.snap",
		"packages/nadle/test/__snapshots__/features/workspaces/workspaces-resolve-tasks.test.ts.snap",
		"packages/nadle/test/features/workspaces/workspaces-resolve-tasks.test.ts",
		"packages/nadle/test/features/workspaces/workspaces-depends-on-tasks.test.ts"
	]
};

export default config;
