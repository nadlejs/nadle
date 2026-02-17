import Fs from "node:fs/promises";
import Path from "node:path";

import { describe, expect, it } from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";

import { analyzeDocument } from "src/analyzer.js";
import { getDefinition } from "src/definitions.js";

const fixturesDir = Path.resolve(import.meta.dirname, "__fixtures__");

async function setupFixture(name: string) {
	const filePath = Path.resolve(fixturesDir, name);
	const content = await Fs.readFile(filePath, "utf-8");
	const analysis = analyzeDocument(content, name);
	const uri = `file:///${name}`;
	const doc = TextDocument.create(uri, "typescript", 1, content);
	return { analysis: { ...analysis, uri }, doc };
}

describe("getDefinition", () => {
	it("navigates from dependsOn reference to the registration", async () => {
		const { analysis, doc } = await setupFixture("valid.ts");
		const content = doc.getText();
		const dependsOnIdx = content.indexOf('dependsOn: ["compile"');
		const offset = dependsOnIdx + 'dependsOn: ["'.length + 1;
		const position = doc.positionAt(offset);
		const location = getDefinition(analysis, position, doc);

		expect(location).not.toBeNull();
		expect(location!.uri).toBe(analysis.uri);

		const compileReg = analysis.registrations.find((r) => r.name === "compile");
		expect(location!.range).toEqual(compileReg!.registrationRange);
	});

	it("returns null for workspace-qualified references", async () => {
		const { analysis, doc } = await setupFixture("unresolved-deps.ts");
		const content = doc.getText();
		const wsIdx = content.indexOf('"other-pkg:build"');
		const offset = wsIdx + 1;
		const position = doc.positionAt(offset);
		const location = getDefinition(analysis, position, doc);

		expect(location).toBeNull();
	});

	it("returns null for unresolved references", async () => {
		const { analysis, doc } = await setupFixture("unresolved-deps.ts");
		const content = doc.getText();
		const idx = content.indexOf('"nonexistent"');
		const offset = idx + 1;
		const position = doc.positionAt(offset);
		const location = getDefinition(analysis, position, doc);

		expect(location).toBeNull();
	});

	it("returns null for strings not inside dependsOn", async () => {
		const { analysis, doc } = await setupFixture("valid.ts");
		const content = doc.getText();
		const idx = content.indexOf('"clean-cache"');
		const offset = idx + 1;
		const position = doc.positionAt(offset);
		const location = getDefinition(analysis, position, doc);

		expect(location).toBeNull();
	});

	it("handles single-string dependsOn", async () => {
		const { analysis, doc } = await setupFixture("valid.ts");
		const content = doc.getText();
		const idx = content.indexOf('dependsOn: "build"');
		const offset = idx + 'dependsOn: "'.length;
		const position = doc.positionAt(offset);
		const location = getDefinition(analysis, position, doc);

		expect(location).not.toBeNull();
		const buildReg = analysis.registrations.find((r) => r.name === "build");
		expect(location!.range).toEqual(buildReg!.registrationRange);
	});
});
