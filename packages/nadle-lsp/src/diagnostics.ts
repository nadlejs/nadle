import { DiagnosticSeverity } from "vscode-languageserver";

import type { Diagnostic } from "vscode-languageserver";
import type { DocumentAnalysis } from "./analyzer.js";

const TASK_NAME_PATTERN = /^[a-z](?:[a-z0-9-]*[a-z0-9])?$/i;

export function computeDiagnostics(analysis: DocumentAnalysis): Diagnostic[] {
	const diagnostics: Diagnostic[] = [];

	for (const reg of analysis.registrations) {
		if (reg.name === null) continue;

		if (!TASK_NAME_PATTERN.test(reg.name)) {
			diagnostics.push({
				range: reg.nameRange,
				severity: DiagnosticSeverity.Error,
				code: "nadle/invalid-task-name",
				source: "nadle",
				message: `Task name "${reg.name}" is invalid. Names must start with a letter, contain only letters, numbers, and dashes, and not end with a dash.`
			});
		}
	}

	for (const [name, regs] of analysis.taskNames) {
		if (regs.length < 2) continue;
		for (let idx = 1; idx < regs.length; idx++) {
			diagnostics.push({
				range: regs[idx].nameRange,
				severity: DiagnosticSeverity.Error,
				code: "nadle/duplicate-task-name",
				source: "nadle",
				message: `Task "${name}" is already registered at line ${regs[0].nameRange.start.line + 1}.`
			});
		}
	}

	for (const reg of analysis.registrations) {
		if (!reg.configuration) continue;
		for (const dep of reg.configuration.dependsOn) {
			if (dep.isWorkspaceQualified) continue;
			if (!analysis.taskNames.has(dep.name)) {
				diagnostics.push({
					range: dep.range,
					severity: DiagnosticSeverity.Warning,
					code: "nadle/unresolved-dependency",
					source: "nadle",
					message: `Task "${dep.name}" is not registered in this file.`
				});
			}
		}
	}

	return diagnostics;
}
