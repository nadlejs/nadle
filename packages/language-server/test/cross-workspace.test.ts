import Path from "node:path";
import Fs from "node:fs/promises";

import { getHover } from "src/hover.js";
import { it, expect, describe } from "vitest";
import { analyzeDocument } from "src/analyzer.js";
import { getDefinition } from "src/definitions.js";
import { getCompletions } from "src/completions.js";
import { computeDiagnostics } from "src/diagnostics.js";
import type { DocumentAnalysis } from "src/analyzer.js";
import { DiagnosticSeverity } from "vscode-languageserver";
import type { ProjectContext } from "src/project-context.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { Project, Workspace, RootWorkspace } from "@nadle/project-resolver";

const fixturesDir = Path.resolve(import.meta.dirname, "__fixtures__");

async function setupFixture(name: string, uri?: string) {
	const filePath = Path.resolve(fixturesDir, name);
	const content = await Fs.readFile(filePath, "utf-8");
	const analysis = analyzeDocument(content, name);
	const docUri = uri ?? `file:///${name}`;
	const doc = TextDocument.create(docUri, "typescript", 1, content);

	return { doc, analysis: { ...analysis, uri: docUri } as DocumentAnalysis };
}

function createMockProjectContext(workspaceUriMap: Map<string, string>, workspaces: Array<{ id: string; label: string }>): ProjectContext {
	const mockWorkspaces: Workspace[] = workspaces.map((ws) => ({
		id: ws.id,
		label: ws.label,
		dependencies: [],
		relativePath: ws.id,
		configFilePath: null,
		absolutePath: `/mock/${ws.id}`,
		packageJson: { name: ws.id, version: "1.0.0" }
	}));

	const rootWorkspace: RootWorkspace = {
		label: "",
		id: "root",
		dependencies: [],
		relativePath: ".",
		absolutePath: "/mock",
		configFilePath: "/mock/nadle.config.ts",
		packageJson: { name: "root", version: "1.0.0" }
	};

	const project: Project = {
		rootWorkspace,
		packageManager: "pnpm",
		currentWorkspaceId: "root",
		workspaces: mockWorkspaces
	};

	return { project, workspaceUriMap };
}

describe("cross-workspace features", () => {
	describe("diagnostics", () => {
		it("flags unknown workspace in workspace-qualified dep", async () => {
			const { analysis } = await setupFixture("workspace-deps.ts", "file:///app/nadle.config.ts");
			const { analysis: libAnalysis } = await setupFixture("workspace-lib.ts", "file:///lib/nadle.config.ts");

			const workspaceUriMap = new Map([
				["file:///app/nadle.config.ts", "app"],
				["file:///lib/nadle.config.ts", "lib"]
			]);

			const projectContext = createMockProjectContext(workspaceUriMap, [
				{ id: "app", label: "app" },
				{ id: "lib", label: "lib" }
			]);

			const allAnalyses = [analysis, libAnalysis];
			const diagnostics = computeDiagnostics(analysis, allAnalyses, projectContext);
			const unknownWs = diagnostics.filter((d) => d.code === "nadle/unknown-workspace");

			expect(unknownWs).toHaveLength(1);
			expect(unknownWs[0].message).toContain("unknown-ws");
			expect(unknownWs[0].severity).toBe(DiagnosticSeverity.Warning);
		});

		it("flags unresolved task in known workspace", async () => {
			const { analysis } = await setupFixture("workspace-deps.ts", "file:///app/nadle.config.ts");
			const { analysis: libAnalysis } = await setupFixture("workspace-lib.ts", "file:///lib/nadle.config.ts");

			const workspaceUriMap = new Map([
				["file:///app/nadle.config.ts", "app"],
				["file:///lib/nadle.config.ts", "lib"]
			]);

			const projectContext = createMockProjectContext(workspaceUriMap, [
				{ id: "app", label: "app" },
				{ id: "lib", label: "lib" }
			]);

			const allAnalyses = [analysis, libAnalysis];
			const diagnostics = computeDiagnostics(analysis, allAnalyses, projectContext);
			const unresolvedWsDep = diagnostics.filter((d) => d.code === "nadle/unresolved-workspace-dependency");

			expect(unresolvedWsDep).toHaveLength(1);
			expect(unresolvedWsDep[0].message).toContain("nonexistent-task");
			expect(unresolvedWsDep[0].severity).toBe(DiagnosticSeverity.Warning);
		});

		it("does not flag valid workspace-qualified dep", async () => {
			const { analysis } = await setupFixture("workspace-deps.ts", "file:///app/nadle.config.ts");
			const { analysis: libAnalysis } = await setupFixture("workspace-lib.ts", "file:///lib/nadle.config.ts");

			const workspaceUriMap = new Map([
				["file:///app/nadle.config.ts", "app"],
				["file:///lib/nadle.config.ts", "lib"]
			]);

			const projectContext = createMockProjectContext(workspaceUriMap, [
				{ id: "app", label: "app" },
				{ id: "lib", label: "lib" }
			]);

			const allAnalyses = [analysis, libAnalysis];
			const diagnostics = computeDiagnostics(analysis, allAnalyses, projectContext);
			const messages = diagnostics.map((d) => d.message);
			expect(messages.some((m) => m.includes("lib:compile"))).toBe(false);
		});
	});

	describe("completions", () => {
		it("suggests cross-workspace tasks in dependsOn", async () => {
			const { doc, analysis } = await setupFixture("workspace-deps.ts", "file:///app/nadle.config.ts");
			const { analysis: libAnalysis } = await setupFixture("workspace-lib.ts", "file:///lib/nadle.config.ts");

			const workspaceUriMap = new Map([
				["file:///app/nadle.config.ts", "app"],
				["file:///lib/nadle.config.ts", "lib"]
			]);

			const projectContext = createMockProjectContext(workspaceUriMap, [
				{ id: "app", label: "app" },
				{ id: "lib", label: "lib" }
			]);

			const content = doc.getText();
			const marker = 'dependsOn: ["build", "lib:compile"';
			const idx = content.indexOf(marker);
			const offset = idx + 'dependsOn: ["'.length;

			const allAnalyses = [analysis, libAnalysis];
			const items = getCompletions(analysis, doc.positionAt(offset), doc, {
				allAnalyses,
				projectContext
			});
			const labels = items.map((i) => i.label);

			expect(labels).toContain("lib:compile");
			expect(labels).toContain("lib:lint");
		});
	});

	describe("definitions", () => {
		it("navigates to workspace-qualified task definition", async () => {
			const { doc, analysis } = await setupFixture("workspace-deps.ts", "file:///app/nadle.config.ts");
			const { analysis: libAnalysis } = await setupFixture("workspace-lib.ts", "file:///lib/nadle.config.ts");

			const workspaceUriMap = new Map([
				["file:///app/nadle.config.ts", "app"],
				["file:///lib/nadle.config.ts", "lib"]
			]);

			const projectContext = createMockProjectContext(workspaceUriMap, [
				{ id: "app", label: "app" },
				{ id: "lib", label: "lib" }
			]);

			const content = doc.getText();
			const idx = content.indexOf('"lib:compile"');
			const offset = idx + 1;

			const allAnalyses = [analysis, libAnalysis];
			const location = getDefinition(analysis, doc.positionAt(offset), doc, {
				allAnalyses,
				projectContext
			});

			expect(location).not.toBeNull();
			expect(location!.uri).toBe("file:///lib/nadle.config.ts");

			const compileReg = libAnalysis.registrations.find((r) => r.name === "compile");
			expect(location!.range).toEqual(compileReg!.registrationRange);
		});

		it("returns null for workspace-qualified ref without project context", async () => {
			const { doc, analysis } = await setupFixture("workspace-deps.ts", "file:///app/nadle.config.ts");

			const content = doc.getText();
			const idx = content.indexOf('"lib:compile"');
			const offset = idx + 1;

			const location = getDefinition(analysis, doc.positionAt(offset), doc, {
				projectContext: null,
				allAnalyses: [analysis]
			});
			expect(location).toBeNull();
		});
	});

	describe("hover", () => {
		it("shows hover for workspace-qualified task", async () => {
			const { doc, analysis } = await setupFixture("workspace-deps.ts", "file:///app/nadle.config.ts");
			const { analysis: libAnalysis } = await setupFixture("workspace-lib.ts", "file:///lib/nadle.config.ts");

			const workspaceUriMap = new Map([
				["file:///app/nadle.config.ts", "app"],
				["file:///lib/nadle.config.ts", "lib"]
			]);

			const projectContext = createMockProjectContext(workspaceUriMap, [
				{ id: "app", label: "app" },
				{ id: "lib", label: "lib" }
			]);

			const content = doc.getText();
			const idx = content.indexOf('"lib:compile"');
			const offset = idx + 1;

			const allAnalyses = [analysis, libAnalysis];
			const hover = getHover(analysis, doc.positionAt(offset), doc, {
				allAnalyses,
				projectContext
			});

			expect(hover).not.toBeNull();
			const value = (hover!.contents as { value: string }).value;
			expect(value).toContain("lib:compile");
			expect(value).toContain("Compile the library");
		});

		it("returns null for workspace-qualified hover without project context", async () => {
			const { doc, analysis } = await setupFixture("workspace-deps.ts", "file:///app/nadle.config.ts");

			const content = doc.getText();
			const idx = content.indexOf('"lib:compile"');
			const offset = idx + 1;

			const hover = getHover(analysis, doc.positionAt(offset), doc, {
				projectContext: null,
				allAnalyses: [analysis]
			});
			expect(hover).toBeNull();
		});
	});
});
