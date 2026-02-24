import Url from "node:url";
import Path from "node:path";

import type { InitializeResult } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocuments, createConnection, ProposedFeatures, TextDocumentSyncKind } from "vscode-languageserver/node";

import { getHover } from "./hover.js";
import { getReferences } from "./references.js";
import { getDefinition } from "./definitions.js";
import { getCompletions } from "./completions.js";
import type { LspContext } from "./lsp-context.js";
import { DocumentStore } from "./document-store.js";
import { computeDiagnostics } from "./diagnostics.js";
import { type ProjectContext, discoverProjectContext } from "./project-context.js";

const DEBOUNCE_MS = 200;
const CONFIG_PATTERN = /^nadle\.config\.[cm]?[jt]s$/;

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const store = new DocumentStore();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

let rootPath: string | null = null;
let projectContext: ProjectContext | null = null;

function getLspContext(): LspContext {
	return { projectContext, allAnalyses: store.getAllAnalyses() };
}

connection.onInitialize((params): InitializeResult => {
	if (params.rootUri) {
		rootPath = Url.fileURLToPath(params.rootUri);
	}

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

connection.onInitialized(() => {
	if (rootPath) {
		discoverWorkspaces(rootPath);
	}
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
			connection.sendDiagnostics({
				uri,
				diagnostics: computeDiagnostics(analysis, store.getAllAnalyses(), projectContext)
			});
		}, DEBOUNCE_MS)
	);
}

async function discoverWorkspaces(root: string): Promise<void> {
	projectContext = await discoverProjectContext(root, store);

	for (const doc of documents.all()) {
		if (isNadleConfig(doc.uri)) {
			scheduleAnalysis(doc.uri);
		}
	}
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

	return getCompletions(analysis, position, doc, getLspContext());
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

	return getHover(analysis, position, doc, getLspContext());
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

	return getDefinition(analysis, position, doc, getLspContext());
});

connection.onReferences(({ context, position, textDocument }) => {
	const doc = documents.get(textDocument.uri);

	if (!doc) {
		return [];
	}

	return getReferences(store.getAllAnalyses(), position, doc, context);
});

connection.onNotification("nadle/refreshProject", () => {
	if (rootPath) {
		discoverWorkspaces(rootPath);
	}
});

documents.listen(connection);
connection.listen();
