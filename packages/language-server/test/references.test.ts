import Path from "node:path";
import Fs from "node:fs/promises";

import { it, expect, describe } from "vitest";
import { analyzeDocument } from "src/analyzer.js";
import { getReferences } from "src/references.js";
import { TextDocument } from "vscode-languageserver-textdocument";

const fixturesDir = Path.resolve(import.meta.dirname, "__fixtures__");

async function setupFixture(name: string) {
	const filePath = Path.resolve(fixturesDir, name);
	const content = await Fs.readFile(filePath, "utf-8");
	const analysis = analyzeDocument(content, name);
	const uri = `file:///${name}`;
	const doc = TextDocument.create(uri, "typescript", 1, content);

	return { doc, analysis: { ...analysis, uri } };
}

describe("getReferences", () => {
	it("finds dependsOn refs when cursor is on a registration name", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const idx = content.indexOf('"compile"');
		const offset = idx + 1;
		const position = doc.positionAt(offset);
		const locations = getReferences([analysis], position, doc, { includeDeclaration: true });

		expect(locations.length).toBe(2);

		const compileReg = analysis.registrations.find((r) => r.name === "compile");
		expect(locations).toContainEqual({ uri: analysis.uri, range: compileReg!.nameRange });

		const buildReg = analysis.registrations.find((r) => r.name === "build");
		const compileDep = buildReg!.configuration!.dependsOn.find((d) => d.name === "compile");
		expect(locations).toContainEqual({ uri: analysis.uri, range: compileDep!.range });
	});

	it("finds registration + dependsOn refs from a dependsOn cursor", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const dependsOnIdx = content.indexOf('dependsOn: ["compile"');
		const offset = dependsOnIdx + 'dependsOn: ["'.length + 1;
		const position = doc.positionAt(offset);
		const locations = getReferences([analysis], position, doc, { includeDeclaration: true });

		expect(locations.length).toBe(2);

		const compileReg = analysis.registrations.find((r) => r.name === "compile");
		expect(locations).toContainEqual({ uri: analysis.uri, range: compileReg!.nameRange });

		const buildReg = analysis.registrations.find((r) => r.name === "build");
		const compileDep = buildReg!.configuration!.dependsOn.find((d) => d.name === "compile");
		expect(locations).toContainEqual({ uri: analysis.uri, range: compileDep!.range });
	});

	it("excludes declaration when includeDeclaration is false", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const idx = content.indexOf('"compile"');
		const offset = idx + 1;
		const position = doc.positionAt(offset);
		const locations = getReferences([analysis], position, doc, { includeDeclaration: false });

		expect(locations.length).toBe(1);

		const buildReg = analysis.registrations.find((r) => r.name === "build");
		const compileDep = buildReg!.configuration!.dependsOn.find((d) => d.name === "compile");
		expect(locations).toContainEqual({ uri: analysis.uri, range: compileDep!.range });
	});

	it("returns only declaration for unreferenced task", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const idx = content.indexOf('"clean-cache"');
		const offset = idx + 1;
		const position = doc.positionAt(offset);
		const locations = getReferences([analysis], position, doc, { includeDeclaration: true });

		expect(locations.length).toBe(1);

		const reg = analysis.registrations.find((r) => r.name === "clean-cache");
		expect(locations[0]).toEqual({ uri: analysis.uri, range: reg!.nameRange });
	});

	it("returns empty for unreferenced task with includeDeclaration false", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const idx = content.indexOf('"clean-cache"');
		const offset = idx + 1;
		const position = doc.positionAt(offset);
		const locations = getReferences([analysis], position, doc, { includeDeclaration: false });

		expect(locations).toEqual([]);
	});

	it("returns empty for workspace-qualified references", async () => {
		const { doc, analysis } = await setupFixture("unresolved-deps.ts");
		const content = doc.getText();
		const idx = content.indexOf('"other-pkg:build"');
		const offset = idx + 1;
		const position = doc.positionAt(offset);
		const locations = getReferences([analysis], position, doc, { includeDeclaration: true });

		expect(locations).toEqual([]);
	});

	it("returns empty for non-task strings", async () => {
		const { doc, analysis } = await setupFixture("valid.ts");
		const content = doc.getText();
		const idx = content.indexOf('"Compile TypeScript"');
		const offset = idx + 1;
		const position = doc.positionAt(offset);
		const locations = getReferences([analysis], position, doc, { includeDeclaration: true });

		expect(locations).toEqual([]);
	});
});
