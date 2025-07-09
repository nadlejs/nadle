import c from "tinyrainbow";
import { type Package } from "@manypkg/tools";

import { COLON, SLASH, BACKSLASH } from "../utilities/constants.js";

export interface Workspace {
	readonly id: string;
	readonly label: string;
	readonly relativePath: string;
	readonly absolutePath: string;
	readonly configFilePath: string | null;
}
export interface RootWorkspace extends Omit<Workspace, "configFilePath"> {
	readonly configFilePath: string;
}

export namespace Workspace {
	export const ROOT_WORKSPACE_ID = "root";

	export function create(pkg: Package): Workspace {
		const { relativeDir, dir: absolutePath } = pkg;
		const relativePath = relativeDir.replaceAll(BACKSLASH, SLASH);
		const id = relativePath.replaceAll(SLASH, COLON);

		return { id, label: id, absolutePath, relativePath, configFilePath: null };
	}

	export function isRootWorkspace(workspaceId: string): boolean {
		return workspaceId === Workspace.ROOT_WORKSPACE_ID;
	}

	export function resolve(workspaceLabelOrId: string, workspaces: Workspace[]) {
		const workspace = workspaces.find((ws) => ws.id === workspaceLabelOrId || ws.label === workspaceLabelOrId);

		if (!workspace) {
			throw new Error(
				`Workspace ${c.bold(workspaceLabelOrId)} not found. Available workspaces (including alias): ${workspaces.flatMap((ws) => [c.bold(ws.id), c.bold(ws.label)]).join(", ")}`
			);
		}

		return workspace;
	}
}
