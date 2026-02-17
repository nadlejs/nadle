import Path from "node:path";
import Fs from "node:fs/promises";

import { getHover } from "src/hover.js";
import { it, expect, describe } from "vitest";
import { analyzeDocument } from "src/analyzer.js";
import { TextDocument } from "vscode-languageserver-textdocument";

const fixturesDir = Path.resolve(import.meta.dirname, "__fixtures__");

async function setupFixture(name: string) {
	const filePath = Path.resolve(fixturesDir, name);
	const content = await Fs.readFile(filePath, "utf-8");
	const analysis = analyzeDocument(content, name);
	const doc = TextDocument.create(`file:///${name}`, "typescript", 1, content);

	return { doc, analysis: { ...analysis, uri: doc.uri } };
}

function findStringOffset(content: string, value: string): number {
	const pattern = `"${value}"`;
	const idx = content.indexOf(pattern);

	return idx === -1 ? -1 : idx + 1;
}

describe("getHover", () => {
	it("shows hover on a task registration name", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const offset = findStringOffset(content, "compile");
		const position = doc.positionAt(offset);
		const hover = getHover(analysis, position, doc);

		expect(hover).not.toBeNull();
		expect(hover!.contents).toHaveProperty("value");
		const value = (hover!.contents as { value: string }).value;
		expect(value).toContain("**compile**");
		expect(value).toContain("typed: ExecTask");
	});

	it("includes description in hover content", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const offset = findStringOffset(content, "compile");
		const position = doc.positionAt(offset);
		const hover = getHover(analysis, position, doc);

		const value = (hover!.contents as { value: string }).value;
		expect(value).toContain("Compile TypeScript");
	});

	it("shows dependencies in hover", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const offset = findStringOffset(content, "build");
		const position = doc.positionAt(offset);
		const hover = getHover(analysis, position, doc);

		expect(hover).not.toBeNull();
		const value = (hover!.contents as { value: string }).value;
		expect(value).toContain("compile");
		expect(value).toContain("lint");
	});

	it("shows hover on a dependsOn reference", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const dependsOnIdx = content.indexOf('dependsOn: ["compile"');
		const offset = dependsOnIdx + 'dependsOn: ["'.length + 1;
		const position = doc.positionAt(offset);
		const hover = getHover(analysis, position, doc);

		expect(hover).not.toBeNull();
		const value = (hover!.contents as { value: string }).value;
		expect(value).toContain("**compile**");
	});

	it("returns null for non-task strings", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const position = doc.positionAt(0);
		const hover = getHover(analysis, position, doc);
		expect(hover).toBeNull();
	});

	it("shows minimal hover for tasks without config", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const offset = findStringOffset(content, "clean-cache");
		const position = doc.positionAt(offset);
		const hover = getHover(analysis, position, doc);

		expect(hover).not.toBeNull();
		const value = (hover!.contents as { value: string }).value;
		expect(value).toContain("**clean-cache**");
		expect(value).toContain("no-op");
	});
});
