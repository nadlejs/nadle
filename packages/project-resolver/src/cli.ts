import Process from "node:process";

import type { Workspace, RootWorkspace } from "./types.js";
import { discoverProject, getAllWorkspaces, locateConfigFiles } from "./index.js";

interface WorkspaceInfo {
	readonly id: string;
	readonly absolutePath: string;
	readonly relativePath: string;
	readonly dependencies: string[];
	readonly configFilePath: string | null;
}

function toWorkspaceInfo(workspace: Workspace | RootWorkspace): WorkspaceInfo {
	return {
		id: workspace.id,
		absolutePath: workspace.absolutePath,
		dependencies: workspace.dependencies,
		relativePath: workspace.relativePath,
		configFilePath: workspace.configFilePath || null
	};
}

const args = Process.argv.slice(2);
const cwdIndex = args.indexOf("--cwd");
const cwd = cwdIndex !== -1 && args[cwdIndex + 1] ? args[cwdIndex + 1] : Process.cwd();

const project = await locateConfigFiles(await discoverProject(cwd));

const output = {
	packageManager: project.packageManager,
	projectDir: project.rootWorkspace.absolutePath,
	workspaces: project.workspaces.map(toWorkspaceInfo),
	rootWorkspace: toWorkspaceInfo(project.rootWorkspace),
	allConfigFiles: getAllWorkspaces(project)
		.map((ws) => ws.configFilePath)
		.filter((path): path is string => path !== null && path !== "")
};

// eslint-disable-next-line no-console
console.log(JSON.stringify(output));
