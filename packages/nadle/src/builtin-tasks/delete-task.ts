import Path from "node:path";

import { glob } from "glob";
import { rimraf, type RimrafAsyncOptions } from "rimraf";

import type { MaybeArray } from "../core/index.js";
import { normalizeGlobPath } from "../core/utilities/utils.js";
import { defineTask } from "../core/registration/define-task.js";

/**
 * Options for the DeleteTask.
 * Extends RimrafAsyncOptions and adds required paths property.
 */
export interface DeleteTaskOptions extends RimrafAsyncOptions {
	/** File or directory paths (glob or array of globs) to delete. */
	readonly paths: MaybeArray<string>;
}

/**
 * Task for deleting files and directories using glob patterns.
 *
 * Uses rimraf for deletion and supports all rimraf async options.
 */
export const DeleteTask = defineTask<DeleteTaskOptions>({
	run: async ({ options, context }) => {
		const { paths, ...restOptions } = options;
		const { workingDir } = context;

		// Glob once and delete the resolved paths literally, so the logged list is
		// exactly what gets deleted (no second, independent glob inside rimraf).
		const matchPaths = await glob(paths, { cwd: workingDir });
		context.logger.info(`Current working dir: ${workingDir}`);
		context.logger.info("Deleting paths:", matchPaths.map(normalizeGlobPath).join(", "));

		await rimraf(
			matchPaths.map((matchPath) => Path.resolve(workingDir, matchPath)),
			restOptions
		);
	}
});
