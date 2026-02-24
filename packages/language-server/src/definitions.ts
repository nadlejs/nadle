import ts from "typescript";
import type { Location, Position } from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { parseTaskReference, isWorkspaceQualified } from "@nadle/kernel";

import type { LspContext } from "./lsp-context.js";
import type { DocumentAnalysis } from "./analyzer.js";
import type { ProjectContext } from "./project-context.js";

export function findDependsOnNameAtPosition(content: string, offset: number): { name: string; isWorkspaceQualified: boolean } | null {
	const file = ts.createSourceFile("def.ts", content, ts.ScriptTarget.Latest, true);
	let result: { name: string; isWorkspaceQualified: boolean } | null = null;

	function walk(node: ts.Node): void {
		if (result) {
			return;
		}

		if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === "dependsOn") {
			checkInitializer(node.initializer);
		}

		ts.forEachChild(node, walk);
	}

	function checkInitializer(node: ts.Expression): void {
		if (ts.isStringLiteral(node) && offset > node.getStart(file) && offset < node.getEnd()) {
			result = { name: node.text, isWorkspaceQualified: isWorkspaceQualified(node.text) };
		} else if (ts.isArrayLiteralExpression(node)) {
			for (const el of node.elements) {
				if (ts.isStringLiteral(el) && offset > el.getStart(file) && offset < el.getEnd()) {
					result = { name: el.text, isWorkspaceQualified: isWorkspaceQualified(el.text) };

					return;
				}
			}
		}
	}

	walk(file);

	return result;
}

function findWorkspaceAnalysis(
	workspaceInput: string,
	allAnalyses: DocumentAnalysis[],
	projectContext: ProjectContext
): DocumentAnalysis | undefined {
	for (const [uri, wsId] of projectContext.workspaceUriMap) {
		if (wsId === workspaceInput) {
			return allAnalyses.find((a) => a.uri === uri);
		}
	}

	const allWorkspaces = [projectContext.project.rootWorkspace, ...projectContext.project.workspaces];
	const workspace = allWorkspaces.find((ws) => ws.label === workspaceInput);

	if (!workspace) {
		return undefined;
	}

	for (const [uri, wsId] of projectContext.workspaceUriMap) {
		if (wsId === workspace.id) {
			return allAnalyses.find((a) => a.uri === uri);
		}
	}

	return undefined;
}

export function getDefinition(analysis: DocumentAnalysis, position: Position, document: TextDocument, context: LspContext): Location | null {
	const offset = document.offsetAt(position);
	const ref = findDependsOnNameAtPosition(document.getText(), offset);

	if (!ref) {
		return null;
	}

	if (ref.isWorkspaceQualified) {
		if (!context.projectContext) {
			return null;
		}

		const { taskName, workspaceInput } = parseTaskReference(ref.name);

		if (!workspaceInput) {
			return null;
		}

		const targetAnalysis = findWorkspaceAnalysis(workspaceInput, context.allAnalyses, context.projectContext);

		if (!targetAnalysis) {
			return null;
		}

		const entries = targetAnalysis.taskNames.get(taskName);

		if (!entries || entries.length === 0) {
			return null;
		}

		return {
			uri: targetAnalysis.uri,
			range: entries[0].registrationRange
		};
	}

	const entries = analysis.taskNames.get(ref.name);

	if (!entries || entries.length === 0) {
		return null;
	}

	return {
		uri: analysis.uri,
		range: entries[0].registrationRange
	};
}
