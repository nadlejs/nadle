import ts from "typescript";

import type { Hover, Position } from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis, TaskRegistration } from "./analyzer.js";

function formatHoverContent(reg: TaskRegistration): string {
	const lines: string[] = [];
	const formLabel = reg.taskObjectName ? `${reg.form}: ${reg.taskObjectName}` : reg.form;
	lines.push(`**${reg.name}** *(${formLabel})*`);

	if (reg.configuration?.description) {
		lines.push("", reg.configuration.description);
	}

	const config = reg.configuration;
	if (config) {
		const details: string[] = [];
		if (config.dependsOn.length > 0) {
			details.push(`**Dependencies**: ${config.dependsOn.map((d) => d.name).join(", ")}`);
		}
		if (config.group) details.push(`**Group**: ${config.group}`);
		if (config.hasInputs) details.push(`**Inputs**: declared`);
		if (config.hasOutputs) details.push(`**Outputs**: declared`);

		if (details.length > 0) {
			lines.push("", "---", ...details);
		}
	}

	return lines.join("\n");
}

function findTaskNameAtPosition(content: string, offset: number, analysis: DocumentAnalysis): TaskRegistration | null {
	const file = ts.createSourceFile("hover.ts", content, ts.ScriptTarget.Latest, true);
	let targetName: string | null = null;

	function walk(node: ts.Node): void {
		if (targetName !== null) return;
		if (ts.isStringLiteral(node) && offset >= node.getStart(file) && offset <= node.getEnd()) {
			if (analysis.taskNames.has(node.text)) {
				targetName = node.text;
			}
		}
		ts.forEachChild(node, walk);
	}

	walk(file);
	if (!targetName) return null;

	const regs = analysis.taskNames.get(targetName);
	return regs?.[0] ?? null;
}

export function getHover(analysis: DocumentAnalysis, position: Position, document: TextDocument): Hover | null {
	const offset = document.offsetAt(position);
	const reg = findTaskNameAtPosition(document.getText(), offset, analysis);
	if (!reg) return null;

	return {
		contents: { kind: "markdown", value: formatHoverContent(reg) }
	};
}
