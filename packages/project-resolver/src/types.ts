import { type WorkspaceIdentity } from "@nadle/kernel";

export interface PackageJson {
	readonly name: string;
	readonly version: string;
	readonly scripts?: PackageJson.Dependencies;
	readonly dependencies?: PackageJson.Dependencies;
	readonly devDependencies?: PackageJson.Dependencies;
}

export namespace PackageJson {
	export interface Dependencies {
		readonly [packageName: string]: string;
	}
}

export interface Workspace extends WorkspaceIdentity {
	readonly absolutePath: string;
	readonly dependencies: string[];
	readonly packageJson: PackageJson;
	readonly configFilePath: string | null;
}

export interface RootWorkspace extends Omit<Workspace, "configFilePath"> {
	readonly configFilePath: string;
}

export interface Project {
	readonly packageManager: string;
	readonly workspaces: Workspace[];
	readonly currentWorkspaceId: string;
	readonly rootWorkspace: RootWorkspace;
}
