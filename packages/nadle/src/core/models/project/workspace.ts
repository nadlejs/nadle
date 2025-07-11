import { type Package } from "@manypkg/tools";

import { COLON, SLASH, BACKSLASH } from "../../utilities/constants.js";

/**
 * Represents a workspace in a monorepo or project.
 */
export interface Workspace {
	/** Unique workspace ID (derived from relative path). */
	readonly id: string;
	/** Human-readable label for the workspace. */
	readonly label: string;
	/** Path relative to the root. */
	readonly relativePath: string;
	/** Absolute path to the workspace. */
	readonly absolutePath: string;
	/** Path to the workspace config file, or null if not present. */
	readonly configFilePath: string | null;
}

/**
 * Namespace for Workspace utility functions.
 */
export namespace Workspace {
	/**
	 * Create a Workspace object from a Package.
	 * @param pkg - The package object from @manypkg/tools.
	 * @returns The Workspace object.
	 */
	export function create(pkg: Package): Workspace {
		const { relativeDir, dir: absolutePath } = pkg;
		const relativePath = relativeDir.replaceAll(BACKSLASH, SLASH);
		const id = relativePath.replaceAll(SLASH, COLON);

		return { id, label: id, absolutePath, relativePath, configFilePath: null };
	}
}
