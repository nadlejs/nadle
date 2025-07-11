import type { Declaration } from "../cache/declaration.js";
import type { MaybeArray } from "../../utilities/maybe-array.js";

/**
 * Configuration for a Nadle task.
 */
export interface TaskConfiguration {
	/**
	 * The group name to which this task belongs.
	 */
	group?: string;

	/**
	 * The description of the task.
	 */
	description?: string;

	/**
	 * A task or a list of tasks that this task depends on.
	 */
	dependsOn?: MaybeArray<string>;

	/**
	 * Environment variables to set when running the task.
	 */
	env?: TaskEnv;

	/**
	 * Changes the working directory for the task.
	 */
	workingDir?: string;

	/**
	 * Input declaration for the task.
	 * Declare any files, directories or globs that the task reads from.
	 * These are used for cache key generation.
	 */
	inputs?: MaybeArray<Declaration>;

	/**
	 * Output declaration for the task.
	 * Declare any files or directories that the task produces.
	 * These are used for caching, restoring, and cleanup.
	 */
	outputs?: MaybeArray<Declaration>;
}

/**
 * Environment variables for a task.
 */
export type TaskEnv = Record<string, string | number | boolean>;
