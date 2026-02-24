import Path from "node:path";

import { workspace, RelativePattern } from "vscode";
import type { ExtensionContext, FileSystemWatcher } from "vscode";
import { TransportKind, LanguageClient } from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext): void {
	const serverPath = Path.join(context.extensionPath, "server", "server.js");

	const serverOptions = {
		module: serverPath,
		transport: TransportKind.stdio
	};

	const clientOptions = {
		documentSelector: [
			{ scheme: "file", language: "typescript", pattern: "**/nadle.config.{ts,mts,cts}" },
			{ scheme: "file", language: "javascript", pattern: "**/nadle.config.{js,mjs,cjs}" }
		]
	};

	client = new LanguageClient("nadle", "Nadle Language Server", serverOptions, clientOptions);
	client.start().then(() => {
		const folder = workspace.workspaceFolders?.[0];

		if (!folder) {
			return;
		}

		const watchers: FileSystemWatcher[] = [
			workspace.createFileSystemWatcher(new RelativePattern(folder, "pnpm-workspace.yaml")),
			workspace.createFileSystemWatcher(new RelativePattern(folder, "**/package.json")),
			workspace.createFileSystemWatcher(new RelativePattern(folder, "**/nadle.config.*"))
		];

		for (const watcher of watchers) {
			const notify = (): void => {
				client!.sendNotification("nadle/refreshProject");
			};

			watcher.onDidChange(notify);
			watcher.onDidCreate(notify);
			watcher.onDidDelete(notify);
			context.subscriptions.push(watcher);
		}
	});
}

export function deactivate(): Promise<void> | undefined {
	return client?.stop();
}
