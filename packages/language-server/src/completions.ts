import ts from "typescript";
import { CompletionItemKind } from "vscode-languageserver";
import type { Position, CompletionItem } from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";

import type { LspContext } from "./lsp-context.js";
import type { ProjectContext } from "./project-context.js";
import type { DocumentAnalysis, TaskRegistration } from "./analyzer.js";

function formatDetail(reg: TaskRegistration): string {
	const parts: string[] = [reg.form];

	if (reg.taskObjectName) {
		parts[0] = `${reg.form} (${reg.taskObjectName})`;
	}

	if (reg.configuration?.description) {
		parts.push(reg.configuration.description);
	}

	return parts.join(" — ");
}

function findEnclosingTask(analysis: DocumentAnalysis, position: Position): TaskRegistration | null {
	for (const reg of analysis.registrations) {
		const { end, start } = reg.registrationRange;

		if (position.line >= start.line && position.line <= end.line) {
			return reg;
		}

		if (reg.configuration) {
			const { end: cEnd, start: cStart } = reg.configuration.configRange;

			if (position.line >= cStart.line && position.line <= cEnd.line) {
				return reg;
			}
		}
	}

	return null;
}

function isInsideDependsOnString(content: string, offset: number): boolean {
	const file = ts.createSourceFile("check.ts", content, ts.ScriptTarget.Latest, true);
	let found = false;

	function walk(node: ts.Node): void {
		if (found) {
			return;
		}

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

function resolveWorkspaceLabel(uri: string, projectContext: ProjectContext): string | null {
	const workspaceId = projectContext.workspaceUriMap.get(uri);

	if (!workspaceId) {
		return null;
	}

	const allWorkspaces = [projectContext.project.rootWorkspace, ...projectContext.project.workspaces];
	const workspace = allWorkspaces.find((ws) => ws.id === workspaceId);

	return workspace?.label ?? workspace?.id ?? null;
}

export function getCompletions(analysis: DocumentAnalysis, position: Position, document: TextDocument, context: LspContext): CompletionItem[] {
	const offset = document.offsetAt(position);

	if (!isInsideDependsOnString(document.getText(), offset)) {
		return [];
	}

	const enclosing = findEnclosingTask(analysis, position);
	const items: CompletionItem[] = [];

	for (const [name, entries] of analysis.taskNames) {
		if (enclosing && enclosing.name === name) {
			continue;
		}

		items.push({
			label: name,
			sortText: name,
			filterText: name,
			kind: CompletionItemKind.Value,
			detail: formatDetail(entries[0])
		});
	}

	if (context.projectContext) {
		for (const other of context.allAnalyses) {
			if (other.uri === analysis.uri) {
				continue;
			}

			const wsLabel = resolveWorkspaceLabel(other.uri, context.projectContext);

			if (!wsLabel) {
				continue;
			}

			for (const [name, entries] of other.taskNames) {
				const qualifiedName = `${wsLabel}:${name}`;
				items.push({
					label: qualifiedName,
					sortText: qualifiedName,
					filterText: qualifiedName,
					kind: CompletionItemKind.Value,
					detail: `${wsLabel} — ${formatDetail(entries[0])}`
				});
			}
		}
	}

	return items;
}
