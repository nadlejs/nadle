import { type Package } from "@manypkg/tools";
import { deriveWorkspaceId } from "@nadle/kernel";

import { PackageJson } from "./package.js";
import { SLASH, BACKSLASH } from "../../utilities/constants.js";

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
	/** List of workspace IDs that the workspace depends on */
	readonly dependencies: string[];
	/** Package JSON object for the workspace. */
	readonly packageJson: PackageJson;
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
		const { relativeDir, packageJson, dir: absolutePath } = pkg;
		const relativePath = relativeDir.replaceAll(BACKSLASH, SLASH);
		const id = deriveWorkspaceId(relativePath);

		return { id, label: id, absolutePath, relativePath, dependencies: [], configFilePath: null, packageJson: PackageJson.create(packageJson) };
	}
}
