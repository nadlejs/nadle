import ts from "typescript";
import type { Hover, Position } from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { parseTaskReference, isWorkspaceQualified } from "@nadle/kernel";

import type { LspContext } from "./lsp-context.js";
import type { ProjectContext } from "./project-context.js";
import type { DocumentAnalysis, TaskRegistration } from "./analyzer.js";

function formatHoverContent(reg: TaskRegistration, workspaceLabel?: string): string {
	const lines: string[] = [];
	const formLabel = reg.taskObjectName ? `${reg.form}: ${reg.taskObjectName}` : reg.form;
	const prefix = workspaceLabel ? `${workspaceLabel}:` : "";
	lines.push(`**${prefix}${reg.name}** *(${formLabel})*`);

	if (reg.configuration?.description) {
		lines.push("", reg.configuration.description);
	}

	const config = reg.configuration;

	if (config) {
		const details: string[] = [];

		if (config.dependsOn.length > 0) {
			details.push(`**Dependencies**: ${config.dependsOn.map((d) => d.name).join(", ")}`);
		}

		if (config.group) {
			details.push(`**Group**: ${config.group}`);
		}

		if (config.hasInputs) {
			details.push(`**Inputs**: declared`);
		}

		if (config.hasOutputs) {
			details.push(`**Outputs**: declared`);
		}

		if (details.length > 0) {
			lines.push("", "---", details.join("\n\n"));
		}
	}

	return lines.join("\n");
}

function findTaskNameAtPosition(content: string, offset: number, analysis: DocumentAnalysis): TaskRegistration | null {
	const file = ts.createSourceFile("hover.ts", content, ts.ScriptTarget.Latest, true);
	let targetName: string | null = null;

	function walk(node: ts.Node): void {
		if (targetName !== null) {
			return;
		}

		if (ts.isStringLiteral(node) && offset >= node.getStart(file) && offset <= node.getEnd()) {
			if (analysis.taskNames.has(node.text)) {
				targetName = node.text;
			}
		}

		ts.forEachChild(node, walk);
	}

	walk(file);

	if (!targetName) {
		return null;
	}

	const entries = analysis.taskNames.get(targetName);

	return entries?.[0] ?? null;
}

function findWorkspaceQualifiedTaskAtPosition(
	content: string,
	offset: number,
	allAnalyses: DocumentAnalysis[],
	projectContext: ProjectContext
): { reg: TaskRegistration; workspaceLabel: string } | null {
	const file = ts.createSourceFile("hover.ts", content, ts.ScriptTarget.Latest, true);
	let targetText: string | null = null;

	function walk(node: ts.Node): void {
		if (targetText !== null) {
			return;
		}

		if (ts.isStringLiteral(node) && offset >= node.getStart(file) && offset <= node.getEnd() && isWorkspaceQualified(node.text)) {
			targetText = node.text;
		}

		ts.forEachChild(node, walk);
	}

	walk(file);

	if (!targetText) {
		return null;
	}

	const { taskName, workspaceInput } = parseTaskReference(targetText);

	if (!workspaceInput) {
		return null;
	}

	for (const [uri, wsId] of projectContext.workspaceUriMap) {
		const allWorkspaces = [projectContext.project.rootWorkspace, ...projectContext.project.workspaces];
		const workspace = allWorkspaces.find((ws) => ws.id === wsId);

		if (workspace && (wsId === workspaceInput || workspace.label === workspaceInput)) {
			const targetAnalysis = allAnalyses.find((a) => a.uri === uri);

			if (targetAnalysis) {
				const entries = targetAnalysis.taskNames.get(taskName);

				if (entries && entries.length > 0) {
					return { reg: entries[0], workspaceLabel: workspace.label || workspace.id };
				}
			}
		}
	}

	return null;
}

export function getHover(analysis: DocumentAnalysis, position: Position, document: TextDocument, context: LspContext): Hover | null {
	const offset = document.offsetAt(position);
	const content = document.getText();

	const localReg = findTaskNameAtPosition(content, offset, analysis);

	if (localReg) {
		return {
			contents: { kind: "markdown", value: formatHoverContent(localReg) }
		};
	}

	if (context.projectContext) {
		const wsResult = findWorkspaceQualifiedTaskAtPosition(content, offset, context.allAnalyses, context.projectContext);

		if (wsResult) {
			return {
				contents: {
					kind: "markdown",
					value: formatHoverContent(wsResult.reg, wsResult.workspaceLabel)
				}
			};
		}
	}

	return null;
}
