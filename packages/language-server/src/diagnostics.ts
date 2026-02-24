import type { Diagnostic } from "vscode-languageserver";
import { getAllWorkspaces } from "@nadle/project-resolver";
import { DiagnosticSeverity } from "vscode-languageserver";
import { parseTaskReference, VALID_TASK_NAME_PATTERN } from "@nadle/kernel";

import type { DocumentAnalysis } from "./analyzer.js";
import type { ProjectContext } from "./project-context.js";

function findAnalysisByWorkspaceId(
	workspaceId: string,
	allAnalyses: DocumentAnalysis[],
	projectContext: ProjectContext
): DocumentAnalysis | undefined {
	for (const [uri, wsId] of projectContext.workspaceUriMap) {
		if (wsId === workspaceId) {
			return allAnalyses.find((a) => a.uri === uri);
		}
	}

	return undefined;
}

export function computeDiagnostics(analysis: DocumentAnalysis, allAnalyses: DocumentAnalysis[], projectContext: ProjectContext | null): Diagnostic[] {
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
				if (projectContext) {
					const { taskName, workspaceInput } = parseTaskReference(dep.name);
					const allWorkspaces = getAllWorkspaces(projectContext.project);
					const targetWorkspace = allWorkspaces.find((ws) => ws.id === workspaceInput || ws.label === workspaceInput);

					if (!targetWorkspace) {
						diagnostics.push({
							source: "nadle",
							range: dep.range,
							code: "nadle/unknown-workspace",
							severity: DiagnosticSeverity.Warning,
							message: `Workspace "${workspaceInput}" is not found in the project.`
						});
					} else {
						const targetAnalysis = findAnalysisByWorkspaceId(targetWorkspace.id, allAnalyses, projectContext);

						if (targetAnalysis && !targetAnalysis.taskNames.has(taskName)) {
							diagnostics.push({
								source: "nadle",
								range: dep.range,
								severity: DiagnosticSeverity.Warning,
								code: "nadle/unresolved-workspace-dependency",
								message: `Task "${taskName}" is not registered in workspace "${workspaceInput}".`
							});
						}
					}
				}

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
