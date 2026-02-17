import ts from "typescript";
import { CompletionItemKind } from "vscode-languageserver";

import type { CompletionItem, Position } from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis, TaskRegistration } from "./analyzer.js";

function formatDetail(reg: TaskRegistration): string {
	const parts: string[] = [reg.form];
	if (reg.taskObjectName) parts[0] = `${reg.form} (${reg.taskObjectName})`;
	if (reg.configuration?.description) parts.push(reg.configuration.description);
	return parts.join(" — ");
}

function findEnclosingTask(analysis: DocumentAnalysis, position: Position): TaskRegistration | null {
	for (const reg of analysis.registrations) {
		const { start, end } = reg.registrationRange;
		if (position.line >= start.line && position.line <= end.line) return reg;

		if (reg.configuration) {
			const { start: cStart, end: cEnd } = reg.configuration.configRange;
			if (position.line >= cStart.line && position.line <= cEnd.line) return reg;
		}
	}
	return null;
}

function isInsideDependsOnString(content: string, offset: number): boolean {
	const file = ts.createSourceFile("check.ts", content, ts.ScriptTarget.Latest, true);
	let found = false;

	function walk(node: ts.Node): void {
		if (found) return;
		if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === "dependsOn") {
			const init = node.initializer;
			if (ts.isStringLiteral(init) && offset > init.getStart(file) && offset < init.getEnd()) {
				found = true;
				return;
			}
			if (ts.isArrayLiteralExpression(init)) {
				for (const el of init.elements) {
					if (ts.isStringLiteral(el) && offset > el.getStart(file) && offset < el.getEnd()) {
						found = true;
						return;
					}
				}
			}
		}
		ts.forEachChild(node, walk);
	}

	walk(file);
	return found;
}

export function getCompletions(analysis: DocumentAnalysis, position: Position, document: TextDocument): CompletionItem[] {
	const offset = document.offsetAt(position);
	if (!isInsideDependsOnString(document.getText(), offset)) return [];

	const enclosing = findEnclosingTask(analysis, position);
	const items: CompletionItem[] = [];

	for (const [name, regs] of analysis.taskNames) {
		if (enclosing && enclosing.name === name) continue;
		items.push({
			label: name,
			kind: CompletionItemKind.Value,
			detail: formatDetail(regs[0]),
			sortText: name,
			filterText: name
		});
	}

	return items;
}
