import Url from "node:url";
import Path from "node:path";
import Fs from "node:fs/promises";

import { type Project, discoverProject, getAllWorkspaces, locateConfigFiles } from "@nadle/project-resolver";

import type { DocumentStore } from "./document-store.js";

export interface ProjectContext {
	readonly project: Project;
	readonly workspaceUriMap: Map<string, string>;
}

export async function discoverProjectContext(rootPath: string, store: DocumentStore): Promise<ProjectContext | null> {
	try {
		const raw = await discoverProject(rootPath);
		const project = await locateConfigFiles(raw);

		store.clearProjectDocuments();

		const workspaceUriMap = new Map<string, string>();

		for (const workspace of getAllWorkspaces(project)) {
			if (!workspace.configFilePath) {
				continue;
			}

			try {
				const content = await Fs.readFile(workspace.configFilePath, "utf8");
				const fileName = Path.basename(workspace.configFilePath);
				const uri = Url.pathToFileURL(workspace.configFilePath).href;

				store.updateProjectDocument(uri, 0, content, fileName);
				workspaceUriMap.set(uri, workspace.id);
			} catch {
				// Skip unreadable files
			}
		}

		return { project, workspaceUriMap };
	} catch {
		return null;
	}
}
