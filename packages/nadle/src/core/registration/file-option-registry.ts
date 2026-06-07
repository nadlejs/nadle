import { isRootWorkspaceId } from "@nadle/project-resolver";

import { Messages } from "../utilities/messages.js";
import { type NadleFileOptions } from "../options/types.js";
import { ConfigurationError } from "../utilities/nadle-error.js";

export class FileOptionRegistry {
	private workspaceId: string | null = null;
	private readonly registry = new Map<string, NadleFileOptions>();

	public onConfigureWorkspace(workspaceId: string) {
		this.workspaceId = workspaceId;
	}

	public register(options: NadleFileOptions) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set");
		}

		if (!isRootWorkspaceId(this.workspaceId)) {
			throw new ConfigurationError(Messages.InvalidConfigureUsage());
		}

		this.registry.set(this.workspaceId, options);
	}

	public get(workspaceId: string): NadleFileOptions {
		if (!isRootWorkspaceId(workspaceId)) {
			throw new ConfigurationError(Messages.InvalidConfigureUsage());
		}

		return this.registry.get(workspaceId) ?? {};
	}
}
