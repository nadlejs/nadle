import { SymbolKind, type DocumentSymbol } from "vscode-languageserver";

import type { DocumentAnalysis } from "./analyzer.js";

/**
 * Builds the document outline (File Structure) for a nadle config file: one
 * symbol per `tasks.register(...)` call. Registrations whose name could not be
 * statically resolved (dynamic/computed names) are omitted.
 */
export function getDocumentSymbols(analysis: DocumentAnalysis): DocumentSymbol[] {
	const symbols: DocumentSymbol[] = [];

	for (const registration of analysis.registrations) {
		if (registration.name === null) {
			continue;
		}

		symbols.push({
			name: registration.name,
			kind: SymbolKind.Function,
			range: registration.registrationRange,
			selectionRange: registration.nameRange,
			detail: registration.taskObjectName ?? undefined
		});
	}

	return symbols;
}
