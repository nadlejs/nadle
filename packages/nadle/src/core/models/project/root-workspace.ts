import { type Workspace } from "./workspace.js";
import { DOT } from "../../utilities/constants.js";

/**
 * Represents the root workspace, with a required configFilePath.
 */
export interface RootWorkspace extends Omit<Workspace, "configFilePath"> {
	/** Path to the root workspace config file. */
	readonly configFilePath: string;
}

/**
 * Namespace for RootWorkspace utility functions and constants.
 */
export namespace RootWorkspace {
	/** The ID for the root workspace. */
	export const ID = "root";

	/**
	 * Create a RootWorkspace object from an absolute path.
	 * @param absolutePath - The absolute path to the root workspace.
	 * @returns The RootWorkspace object.
	 */
	export function create(absolutePath: string): RootWorkspace {
		return { id: ID, label: "", absolutePath, relativePath: DOT, configFilePath: "" };
	}

	/**
	 * Check if a workspace ID is the root workspace.
	 * @param workspaceId - The workspace ID to check.
	 * @returns True if the ID is the root workspace.
	 */
	export function isRootWorkspaceId(workspaceId: string): boolean {
		return workspaceId === ID;
	}
}
