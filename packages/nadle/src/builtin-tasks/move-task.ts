import Path from "node:path";
import Fs from "node:fs/promises";

import { defineTask } from "../core/registration/define-task.js";
import { shouldWrite, resolveTargets, type OverwritePolicy, type FileOperationOptions } from "./file-operations.js";

/**
 * Options for the MoveTask.
 */
export interface MoveTaskOptions extends FileOperationOptions {
	/** Behavior when a destination file already exists. Defaults to `replace`. */
	readonly overwrite?: OverwritePolicy;
}

/**
 * Task for moving files and directories.
 *
 * Same selection semantics as CopyTask, but sources are removed after the move.
 * Uses a rename syscall when possible and falls back to copy-then-delete (e.g.
 * across devices). Skipped files (overwrite policy) keep their source.
 */
export const MoveTask = defineTask<MoveTaskOptions>({
	run: async ({ options, context }) => {
		const targets = await resolveTargets(options, context);
		const overwrite = options.overwrite ?? "replace";

		for (const [target, source] of targets) {
			if (!(await shouldWrite(target, overwrite, context))) {
				continue;
			}

			await Fs.mkdir(Path.dirname(target), { recursive: true });
			context.logger.log(`Move ${Path.relative(context.workingDir, source)} -> ${Path.relative(context.workingDir, target)}`);

			try {
				await Fs.rename(source, target);
			} catch {
				// Cross-device moves cannot rename; copy and delete instead.
				await Fs.cp(source, target);
				await Fs.rm(source);
			}
		}

		context.logger.info(`Moved ${targets.size} file(s) into ${options.into}`);
	}
});
