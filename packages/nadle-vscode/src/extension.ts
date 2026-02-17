import Path from "node:path";

import type { ExtensionContext } from "vscode";
import { TransportKind, LanguageClient } from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext): void {
	const serverPath = Path.join(context.extensionPath, "server", "server.js");

	const serverOptions = {
		module: serverPath,
		transport: TransportKind.stdio
	};

	const clientOptions = {
		documentSelector: [{ language: "nadle-config" }]
	};

	client = new LanguageClient("nadle", "Nadle Language Server", serverOptions, clientOptions);
	client.start();
}

export function deactivate(): Promise<void> | undefined {
	return client?.stop();
}
