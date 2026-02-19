import Path from "node:path";
import Module from "node:module";
import Fs from "node:fs/promises";

const require = Module.createRequire(import.meta.url);
const specMd: { html: (filepath: string, options?: { head?: string }) => string } = require("spec-md");

const rootDir = Path.resolve(__dirname, "..", "..", "..");
const specDir = Path.join(rootDir, "spec");
const outputDir = Path.join(__dirname, "..", "static", "spec");
const tempFile = Path.join(outputDir, "_combined.md");
const GITHUB_SPEC_URL = "https://github.com/nadlejs/nadle/blob/main/spec";

const README_EXCLUDED_SECTIONS = new Set(["How to Read", "Files", "Versioning", "Relationship to User-Facing Docs"]);

const SPEC_FILES = [
	"01-task.md",
	"02-task-configuration.md",
	"03-scheduling.md",
	"04-execution.md",
	"05-caching.md",
	"06-project.md",
	"07-workspace.md",
	"08-configuration-loading.md",
	"09-cli.md",
	"10-builtin-tasks.md",
	"11-events.md",
	"12-error-handling.md",
	"13-reporting.md"
];

function shiftHeadings(content: string): string {
	const lines = content.split("\n");
	let inFencedBlock = false;

	return lines
		.map((line) => {
			if (line.startsWith("```")) {
				inFencedBlock = !inFencedBlock;
			}

			if (!inFencedBlock && /^#{1,5}\s/.test(line)) {
				return `#${line}`;
			}

			return line;
		})
		.join("\n");
}

function shiftSubheadings(content: string): string {
	const lines = content.split("\n");
	let inFencedBlock = false;

	return lines
		.map((line) => {
			if (line.startsWith("```")) {
				inFencedBlock = !inFencedBlock;
			}

			if (!inFencedBlock && /^#{2,5}\s/.test(line)) {
				return `#${line}`;
			}

			return line;
		})
		.join("\n");
}

function filterReadmeSections(content: string): string {
	const lines = content.split("\n");
	const result: string[] = [];
	let skipping = false;

	for (const line of lines) {
		const headingMatch = line.match(/^(##)\s+(.+)/);

		if (headingMatch) {
			skipping = README_EXCLUDED_SECTIONS.has(headingMatch[2]);
		}

		if (!skipping) {
			result.push(line);
		}
	}

	return result.join("\n");
}

function stripNumberPrefix(content: string): string {
	return content.replace(/^(#+\s+)\d{2}\s+—\s+/m, "$1");
}

function convertCrossReferences(content: string): string {
	return content.replace(/\]\((\d{2}-[\w-]+)\.md\)/g, "](#$1)").replace(/\]\(CHANGELOG\.md\)/g, `](${GITHUB_SPEC_URL}/CHANGELOG.md)`);
}

async function main() {
	await Fs.mkdir(outputDir, { recursive: true });

	const readmeSrc = await Fs.readFile(Path.join(specDir, "README.md"), "utf-8");
	const readmeFiltered = filterReadmeSections(readmeSrc);
	const readmeConverted = convertCrossReferences(shiftSubheadings(readmeFiltered));

	const sections: string[] = [readmeConverted];

	for (const file of SPEC_FILES) {
		const slug = file.replace(/\.md$/, "");
		const raw = await Fs.readFile(Path.join(specDir, file), "utf-8");
		const stripped = stripNumberPrefix(raw);
		const shifted = shiftHeadings(stripped);
		const converted = convertCrossReferences(shifted);

		sections.push(`<a id="${slug}"></a>\n\n${converted}`);
	}

	const combined = sections.join("\n\n---\n\n");
	await Fs.writeFile(tempFile, combined, "utf-8");

	const html = specMd.html(tempFile, {
		head: '<meta name="viewport" content="width=device-width, initial-scale=1">'
	});

	await Fs.writeFile(Path.join(outputDir, "index.html"), html, "utf-8");
	await Fs.rm(tempFile);

	console.log("Spec HTML generated at packages/docs/static/spec/index.html");
}

main().catch((error) => {
	console.error("Error building spec HTML.", error);
	// eslint-disable-next-line n/no-process-exit
	process.exit(1);
});
