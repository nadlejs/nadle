import * as Path from "node:path";
import Fs from "node:fs/promises";

import { glob } from "glob";

const rootDoc = Path.join(__dirname, "..");

const apiDocPath = Path.join(rootDoc, "docs", "api");
const README_FILE_NAME = "README.md";
const CATEGORY_FILE_NAME = "_category_.json";

async function main() {
	await Fs.rm(Path.join(apiDocPath, README_FILE_NAME), { force: true });

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

	// Update sidebar item labels
	for (const entry of await glob("**/", { nodir: false, cwd: apiDocPath })) {
		const path = Path.join(apiDocPath, entry);

		const dirName = Path.basename(path);
		const label = dirName
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		await Fs.writeFile(Path.join(path, CATEGORY_FILE_NAME), JSON.stringify({ label }), "utf-8");
	}

	// Update top sidebar item and its content
	await Fs.writeFile(Path.join(apiDocPath, "index", CATEGORY_FILE_NAME), JSON.stringify({ label: "API Reference" }), "utf-8");

	const indexFileContent = await Fs.readFile(Path.join(apiDocPath, "index", README_FILE_NAME), "utf-8");
	const indexFileLines = indexFileContent.split("\n");
	const h1IndexLine = indexFileLines.indexOf(`# index`);

	if (h1IndexLine !== -1) {
		const adjustedContent = [`---`, `title: "API Reference"`, `---`, ...indexFileLines.slice(h1IndexLine + 1)].join("\n");
		await Fs.writeFile(Path.join(apiDocPath, "index", "README.md"), adjustedContent, "utf-8");
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
