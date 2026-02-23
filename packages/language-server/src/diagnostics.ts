import type { Diagnostic } from "vscode-languageserver";
import { VALID_TASK_NAME_PATTERN } from "@nadle/kernel";
import { DiagnosticSeverity } from "vscode-languageserver";

import type { DocumentAnalysis } from "./analyzer.js";

export function computeDiagnostics(analysis: DocumentAnalysis): Diagnostic[] {
	const diagnostics: Diagnostic[] = [];

	for (const reg of analysis.registrations) {
		if (reg.name === null) {
			continue;
		}

		if (!VALID_TASK_NAME_PATTERN.test(reg.name)) {
			diagnostics.push({
				source: "nadle",
				range: reg.nameRange,
				code: "nadle/invalid-task-name",
				severity: DiagnosticSeverity.Error,
				message: `Task name "${reg.name}" is invalid. Names must start with a letter, contain only letters, numbers, and dashes, and not end with a dash.`
			});
		}
	}

	for (const [name, entries] of analysis.taskNames) {
		if (entries.length < 2) {
			continue;
		}

		for (let idx = 1; idx < entries.length; idx++) {
			diagnostics.push({
				source: "nadle",
				range: entries[idx].nameRange,
				code: "nadle/duplicate-task-name",
				severity: DiagnosticSeverity.Error,
				message: `Task "${name}" is already registered at line ${entries[0].nameRange.start.line + 1}.`
			});
		}
	}

	for (const reg of analysis.registrations) {
		if (!reg.configuration) {
			continue;
		}

		for (const dep of reg.configuration.dependsOn) {
			if (dep.isWorkspaceQualified) {
				continue;
			}

			if (!analysis.taskNames.has(dep.name)) {
				diagnostics.push({
					source: "nadle",
					range: dep.range,
					code: "nadle/unresolved-dependency",
					severity: DiagnosticSeverity.Warning,
					message: `Task "${dep.name}" is not registered in this file.`
				});
			}
		}
	}

	return diagnostics;
}
