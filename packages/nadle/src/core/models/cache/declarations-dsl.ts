import { type DirDeclaration, type FileDeclaration } from "./declaration.js";

/**
 * Namespace for declaring file and directory input patterns for caching.
 */
export namespace Inputs {
	/**
	 * Declare file input patterns for caching.
	 * @param patterns - Glob patterns matching files.
	 * @returns FileDeclaration object.
	 */
	export function files(...patterns: string[]): FileDeclaration {
		return { patterns, type: "file" };
	}

	/**
	 * Declare directory input patterns for caching.
	 * @param patterns - Glob patterns matching directories.
	 * @returns DirDeclaration object.
	 */
	export function dirs(...patterns: string[]): DirDeclaration {
		return { patterns, type: "dir" };
	}
}

/**
 * Utilities for declaring file and directory output patterns for caching.
 *
 * These are aliases of {@link Inputs.files} and {@link Inputs.dirs}.
 */
export namespace Outputs {
	/**
	 * Declare file output patterns for caching.
	 * @see Inputs.files
	 */
	export const files = Inputs.files;

	/**
	 * Declare directory output patterns for caching.
	 * @see Inputs.dirs
	 */
	export const dirs = Inputs.dirs;
}
