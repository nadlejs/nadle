import Path from "node:path";
import Fs from "node:fs/promises";

import pLimit from "p-limit";

import { defineTask } from "../core/registration/define-task.js";
import { shouldWrite, resolveTargets, type OverwritePolicy, type FileOperationOptions } from "./file-operations.js";

const COPY_CONCURRENCY = 8;

/**
 * Options for the CopyTask.
 */
export interface CopyTaskOptions extends FileOperationOptions {
	/** Behavior when a destination file already exists. Defaults to `replace`. */
	readonly overwrite?: OverwritePolicy;
}

/**
 * Task for copying files and directories.
 *
 * Sources are files, directories, or glob selectors; the destination (`into`) is
 * always a directory. Supports flattening, renaming, and overwrite policies.
 */
export const CopyTask = defineTask<CopyTaskOptions>({
	run: async ({ options, context }) => {
		const targets = await resolveTargets(options, context);
		const overwrite = options.overwrite ?? "replace";
		const limit = pLimit(COPY_CONCURRENCY);

		await Promise.all(
			[...targets.entries()].map(([target, source]) =>
				limit(async () => {
					if (!(await shouldWrite(target, overwrite, context))) {
						return;
					}

					await Fs.mkdir(Path.dirname(target), { recursive: true });
					context.logger.log(`Copy ${Path.relative(context.workingDir, source)} -> ${Path.relative(context.workingDir, target)}`);
					await Fs.cp(source, target);
				})
			)
		);
		context.logger.info(`Copied ${targets.size} file(s) into ${options.into}`);
	}
});
