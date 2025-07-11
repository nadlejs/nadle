import { Inputs } from "./inputs.js";

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
