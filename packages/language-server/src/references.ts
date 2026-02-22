import type { TextDocument } from "vscode-languageserver-textdocument";
import type { Location, Position, ReferenceContext } from "vscode-languageserver";

import type { DocumentAnalysis } from "./analyzer.js";
import { findDependsOnNameAtPosition } from "./definitions.js";

function findRegistrationNameAtPosition(analysis: DocumentAnalysis, offset: number, document: TextDocument): string | null {
	for (const reg of analysis.registrations) {
		if (reg.name === null) {
			continue;
		}

		const start = document.offsetAt(reg.nameRange.start);
		const end = document.offsetAt(reg.nameRange.end);

		if (offset > start && offset < end) {
			return reg.name;
		}
	}

	return null;
}

export function getReferences(analyses: DocumentAnalysis[], position: Position, document: TextDocument, context: ReferenceContext): Location[] {
	const offset = document.offsetAt(position);
	const content = document.getText();
	const currentUri = document.uri;

	const currentAnalysis = analyses.find((a) => a.uri === currentUri);
	let taskName: string | null = null;

	const depRef = findDependsOnNameAtPosition(content, offset);

	if (depRef && !depRef.isWorkspaceQualified) {
		taskName = depRef.name;
	}

	if (!taskName && currentAnalysis) {
		taskName = findRegistrationNameAtPosition(currentAnalysis, offset, document);
	}

	if (!taskName) {
		return [];
	}

	const locations: Location[] = [];

	for (const analysis of analyses) {
		if (context.includeDeclaration) {
			const entries = analysis.taskNames.get(taskName);

			if (entries) {
				for (const entry of entries) {
					locations.push({ uri: analysis.uri, range: entry.nameRange });
				}
			}
		}

		for (const reg of analysis.registrations) {
			if (!reg.configuration) {
				continue;
			}

			for (const dep of reg.configuration.dependsOn) {
				if (dep.name === taskName && !dep.isWorkspaceQualified) {
					locations.push({ range: dep.range, uri: analysis.uri });
				}
			}
		}
	}

	return locations;
}
