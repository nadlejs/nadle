import Url from "node:url";
import Path from "node:path";

import type { InitializeResult } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocuments, createConnection, ProposedFeatures, TextDocumentSyncKind } from "vscode-languageserver/node";

import { getHover } from "./hover.js";
import { getReferences } from "./references.js";
import { getDefinition } from "./definitions.js";
import { getCompletions } from "./completions.js";
import { DocumentStore } from "./document-store.js";
import { computeDiagnostics } from "./diagnostics.js";

const DEBOUNCE_MS = 200;
const CONFIG_PATTERN = /^nadle\.config\.[cm]?[jt]s$/;

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const store = new DocumentStore();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

connection.onInitialize((): InitializeResult => {
	return {
		capabilities: {
			hoverProvider: true,
			definitionProvider: true,
			referencesProvider: true,
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: false,
				triggerCharacters: ['"', "'"]
			}
		}
	};
});

function isNadleConfig(uri: string): boolean {
	const fileName = Path.basename(Url.fileURLToPath(uri));

	return CONFIG_PATTERN.test(fileName);
}

function scheduleAnalysis(uri: string): void {
	const existing = debounceTimers.get(uri);

	if (existing) {
		clearTimeout(existing);
	}

	debounceTimers.set(
		uri,
		setTimeout(() => {
			debounceTimers.delete(uri);
			const doc = documents.get(uri);

			if (!doc) {
				return;
			}

			const fileName = Path.basename(Url.fileURLToPath(uri));
			const analysis = store.updateDocument(uri, doc.version, doc.getText(), fileName);
			connection.sendDiagnostics({ uri, diagnostics: computeDiagnostics(analysis) });
		}, DEBOUNCE_MS)
	);
}

documents.onDidChangeContent(({ document }) => {
	if (isNadleConfig(document.uri)) {
		scheduleAnalysis(document.uri);
	}
});

documents.onDidClose(({ document }) => {
	const timer = debounceTimers.get(document.uri);

	if (timer) {
		clearTimeout(timer);
	}

	debounceTimers.delete(document.uri);
	store.removeDocument(document.uri);
	connection.sendDiagnostics({ diagnostics: [], uri: document.uri });
});

connection.onCompletion(({ position, textDocument }) => {
	const analysis = store.getAnalysis(textDocument.uri);

	if (!analysis) {
		return [];
	}

	const doc = documents.get(textDocument.uri);

	if (!doc) {
		return [];
	}

	return getCompletions(analysis, position, doc);
});

connection.onHover(({ position, textDocument }) => {
	const analysis = store.getAnalysis(textDocument.uri);

	if (!analysis) {
		return null;
	}

	const doc = documents.get(textDocument.uri);

	if (!doc) {
		return null;
	}

	return getHover(analysis, position, doc);
});

connection.onDefinition(({ position, textDocument }) => {
	const analysis = store.getAnalysis(textDocument.uri);

	if (!analysis) {
		return null;
	}

	const doc = documents.get(textDocument.uri);

	if (!doc) {
		return null;
	}

	return getDefinition(analysis, position, doc);
});

connection.onReferences(({ context, position, textDocument }) => {
	const doc = documents.get(textDocument.uri);

	if (!doc) {
		return [];
	}

	return getReferences(store.getAllAnalyses(), position, doc, context);
});

documents.listen(connection);
connection.listen();
