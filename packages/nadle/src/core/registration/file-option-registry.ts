import { type NadleFileOptions } from "../options/types.js";
import { RootWorkspace } from "../models/project/root-workspace.js";

class FileOptionRegistry {
	private workspaceId: string | null = null;
	private readonly registry = new Map<string, NadleFileOptions>();

	public onInitializeWorkspace(workspaceId: string) {
		this.workspaceId = workspaceId;
	}

	public register(options: NadleFileOptions) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set. Please call updateWorkspace() before registering file options.");
		}

		if (!RootWorkspace.isRootWorkspaceId(this.workspaceId)) {
			throw new Error("File options can only be registered in the root workspace.");
		}

		this.registry.set(this.workspaceId, options);
	}

	public get(workspaceId: string): NadleFileOptions {
		if (!RootWorkspace.isRootWorkspaceId(workspaceId)) {
			throw new Error("File options can only be retrieved from the root workspace.");
		}

		return this.registry.get(workspaceId) ?? {};
	}
}

export const fileOptionRegistry = new FileOptionRegistry();
