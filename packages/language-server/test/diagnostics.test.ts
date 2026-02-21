import Path from "node:path";
import Fs from "node:fs/promises";

import { it, expect, describe } from "vitest";
import { analyzeDocument } from "src/analyzer.js";
import { computeDiagnostics } from "src/diagnostics.js";
import { DiagnosticSeverity } from "vscode-languageserver";

const fixturesDir = Path.resolve(import.meta.dirname, "__fixtures__");

async function diagnosticsFor(fixture: string) {
	const content = await Fs.readFile(Path.resolve(fixturesDir, fixture), "utf-8");
	const analysis = analyzeDocument(content, fixture);

	return computeDiagnostics(analysis);
}

describe("computeDiagnostics", () => {
	describe("valid.ts — zero diagnostics", () => {
		it("produces no diagnostics for a valid config", async () => {
			const diagnostics = await diagnosticsFor("valid.ts");
			expect(diagnostics).toHaveLength(0);
		});
	});

	describe("invalid-names.ts — task name validation", () => {
		it("flags all 6 invalid task names as errors", async () => {
			const diagnostics = await diagnosticsFor("invalid-names.ts");
			const nameErrors = diagnostics.filter((d) => d.code === "nadle/invalid-task-name");
			expect(nameErrors).toHaveLength(6);
		});

		it("uses Error severity for invalid names", async () => {
			const diagnostics = await diagnosticsFor("invalid-names.ts");
			const nameErrors = diagnostics.filter((d) => d.code === "nadle/invalid-task-name");

			for (const diag of nameErrors) {
				expect(diag.severity).toBe(DiagnosticSeverity.Error);
			}
		});

		it("includes the invalid name in the message", async () => {
			const diagnostics = await diagnosticsFor("invalid-names.ts");
			const messages = diagnostics.filter((d) => d.code === "nadle/invalid-task-name").map((d) => d.message);
			expect(messages.some((m) => m.includes("123build"))).toBe(true);
			expect(messages.some((m) => m.includes("my_task"))).toBe(true);
			expect(messages.some((m) => m.includes("build-"))).toBe(true);
		});
	});

	describe("duplicates.ts — duplicate detection", () => {
		it("flags the second registration as duplicate", async () => {
			const diagnostics = await diagnosticsFor("duplicates.ts");
			const dupes = diagnostics.filter((d) => d.code === "nadle/duplicate-task-name");
			expect(dupes).toHaveLength(1);
		});

		it("references the first registration's line in the message", async () => {
			const diagnostics = await diagnosticsFor("duplicates.ts");
			const dupe = diagnostics.find((d) => d.code === "nadle/duplicate-task-name");
			expect(dupe).toBeDefined();
			expect(dupe!.message).toMatch(/line \d+/);
		});

		it("uses Error severity for duplicates", async () => {
			const diagnostics = await diagnosticsFor("duplicates.ts");
			const dupe = diagnostics.find((d) => d.code === "nadle/duplicate-task-name");
			expect(dupe?.severity).toBe(DiagnosticSeverity.Error);
		});
	});

	describe("unresolved-deps.ts — dependency validation", () => {
		it("flags unresolved local dependencies as warnings", async () => {
			const diagnostics = await diagnosticsFor("unresolved-deps.ts");
			const unresolved = diagnostics.filter((d) => d.code === "nadle/unresolved-dependency");
			expect(unresolved).toHaveLength(2);
		});

		it("does not flag workspace-qualified dependencies", async () => {
			const diagnostics = await diagnosticsFor("unresolved-deps.ts");
			const messages = diagnostics.map((d) => d.message);
			expect(messages.some((m) => m.includes("other-pkg:build"))).toBe(false);
		});

		it("uses Warning severity for unresolved deps", async () => {
			const diagnostics = await diagnosticsFor("unresolved-deps.ts");
			const unresolved = diagnostics.filter((d) => d.code === "nadle/unresolved-dependency");

			for (const diag of unresolved) {
				expect(diag.severity).toBe(DiagnosticSeverity.Warning);
			}
		});

		it("flags the specific unresolved names", async () => {
			const diagnostics = await diagnosticsFor("unresolved-deps.ts");
			const messages = diagnostics.filter((d) => d.code === "nadle/unresolved-dependency").map((d) => d.message);
			expect(messages.some((m) => m.includes("nonexistent"))).toBe(true);
			expect(messages.some((m) => m.includes("typo-task"))).toBe(true);
		});
	});

	describe("dynamic-names.ts — non-literal names skipped", () => {
		it("produces no diagnostics for dynamic/non-literal names", async () => {
			const diagnostics = await diagnosticsFor("dynamic-names.ts");
			expect(diagnostics).toHaveLength(0);
		});
	});
});
