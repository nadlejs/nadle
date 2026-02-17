import Path from "node:path";
import Fs from "node:fs/promises";

import { it, expect, describe } from "vitest";
import { analyzeDocument } from "src/analyzer.js";
import { getCompletions } from "src/completions.js";
import { CompletionItemKind } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

const fixturesDir = Path.resolve(import.meta.dirname, "__fixtures__");

async function setupFixture(name: string) {
	const filePath = Path.resolve(fixturesDir, name);
	const content = await Fs.readFile(filePath, "utf-8");
	const analysis = analyzeDocument(content, name);
	const doc = TextDocument.create(`file:///${name}`, "typescript", 1, content);

	return { doc, analysis: { ...analysis, uri: doc.uri } };
}

function offsetInsideDependsOn(content: string): number {
	const marker = 'dependsOn: ["';
	const idx = content.indexOf(marker);

	return idx + marker.length;
}

describe("getCompletions", () => {
	it("returns task names inside a dependsOn string", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const offset = offsetInsideDependsOn(doc.getText());
		const items = getCompletions(analysis, doc.positionAt(offset), doc);

		expect(items.length).toBeGreaterThan(0);
		const labels = items.map((i) => i.label);
		expect(labels).toContain("lint");
	});

	it("excludes the current task from suggestions", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const offset = offsetInsideDependsOn(doc.getText());
		const items = getCompletions(analysis, doc.positionAt(offset), doc);

		const labels = items.map((i) => i.label);
		expect(labels).not.toContain("build");
	});

	it("returns empty array outside dependsOn context", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const items = getCompletions(analysis, doc.positionAt(0), doc);
		expect(items).toHaveLength(0);
	});

	it("uses CompletionItemKind.Value", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const offset = offsetInsideDependsOn(doc.getText());
		const items = getCompletions(analysis, doc.positionAt(offset), doc);

		for (const item of items) {
			expect(item.kind).toBe(CompletionItemKind.Value);
		}
	});

	it("includes detail with form and description", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const offset = offsetInsideDependsOn(doc.getText());
		const items = getCompletions(analysis, doc.positionAt(offset), doc);

		const compileItem = items.find((i) => i.label === "compile");
		expect(compileItem?.detail).toContain("ExecTask");
		expect(compileItem?.detail).toContain("Compile TypeScript");
	});
});
