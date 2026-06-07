import Path from "node:path";
import Fs from "node:fs/promises";

import { it, expect, describe } from "vitest";
import { analyzeDocument } from "src/analyzer.js";
import { SymbolKind } from "vscode-languageserver";
import { getDocumentSymbols } from "src/document-symbols.js";

const fixturesDir = Path.resolve(import.meta.dirname, "__fixtures__");

async function analyzeFixture(name: string) {
	const content = await Fs.readFile(Path.resolve(fixturesDir, name), "utf-8");

	return { ...analyzeDocument(content, name), uri: `file:///${name}` };
}

describe("getDocumentSymbols", () => {
	it("returns one Function symbol per task registration", async () => {
		const analysis = await analyzeFixture("valid.ts");
		const symbols = getDocumentSymbols(analysis);

		expect(symbols.map((s) => s.name)).toEqual(["clean-cache", "compile", "deploy", "lint", "build", "release", "clean"]);
		expect(symbols.every((s) => s.kind === SymbolKind.Function)).toBe(true);
	});

	it("uses the registration range as range and the name range as selectionRange", async () => {
		const analysis = await analyzeFixture("valid.ts");
		const symbols = getDocumentSymbols(analysis);

		const compile = symbols.find((s) => s.name === "compile")!;
		const compileReg = analysis.registrations.find((r) => r.name === "compile")!;

		expect(compile.range).toEqual(compileReg.registrationRange);
		expect(compile.selectionRange).toEqual(compileReg.nameRange);
	});

	it("sets detail to the task object name for typed tasks", async () => {
		const analysis = await analyzeFixture("valid.ts");
		const symbols = getDocumentSymbols(analysis);

		expect(symbols.find((s) => s.name === "compile")!.detail).toBe("ExecTask");
		expect(symbols.find((s) => s.name === "clean")!.detail).toBe("DeleteTask");
		// No-op and function forms have no task object.
		expect(symbols.find((s) => s.name === "clean-cache")!.detail).toBeUndefined();
		expect(symbols.find((s) => s.name === "deploy")!.detail).toBeUndefined();
	});

	it("skips registrations with non-literal (dynamic) names", async () => {
		const analysis = await analyzeFixture("dynamic-names.ts");
		const symbols = getDocumentSymbols(analysis);

		expect(symbols.map((s) => s.name)).toEqual(["lint"]);
	});

	it("returns an empty list for a file with no registrations", () => {
		const analysis = { ...analyzeDocument("export const x = 1;\n", "empty.ts"), uri: "file:///empty.ts" };

		expect(getDocumentSymbols(analysis)).toEqual([]);
	});
});
