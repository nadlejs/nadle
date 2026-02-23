import ts from "typescript";
import { isWorkspaceQualified } from "@nadle/kernel";
import type { Location, Position } from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";

import type { DocumentAnalysis } from "./analyzer.js";

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

export function getDefinition(analysis: DocumentAnalysis, position: Position, document: TextDocument): Location | null {
	const offset = document.offsetAt(position);
	const ref = findDependsOnNameAtPosition(document.getText(), offset);

	if (!ref || ref.isWorkspaceQualified) {
		return null;
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
