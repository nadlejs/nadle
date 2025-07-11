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
