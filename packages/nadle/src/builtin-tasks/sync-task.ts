import Path from "node:path";
import Fs from "node:fs/promises";

import fg from "fast-glob";
import micromatch from "micromatch";

import { MaybeArray } from "../core/index.js";
import { isPathExists } from "../core/utilities/fs.js";
import { type RunnerContext } from "../core/interfaces/task.js";
import { defineTask } from "../core/registration/define-task.js";
import { resolveTargets, type FileOperationOptions } from "./file-operations.js";

/**
 * Options for the SyncTask.
 */
export interface SyncTaskOptions extends FileOperationOptions {
	/** Glob patterns (relative to `into`) for files that are never deleted. */
	readonly preserve?: MaybeArray<string>;
}

/**
 * Task for mirroring sources into a destination directory.
 *
 * Same selection semantics as CopyTask, but after copying, files in `into` that do
 * not correspond to a source (and do not match `preserve`) are deleted, and empty
 * directories are pruned. The destination ends up as an exact mirror.
 */
export const SyncTask = defineTask<SyncTaskOptions>({
	run: async ({ options, context }) => {
		const targets = await resolveTargets(options, context);
		const intoPath = Path.resolve(context.workingDir, options.into);

		for (const [target, source] of targets) {
			await Fs.mkdir(Path.dirname(target), { recursive: true });
			context.logger.log(`Sync ${Path.relative(context.workingDir, source)} -> ${Path.relative(context.workingDir, target)}`);
			await Fs.cp(source, target);
		}

		const deleted = await deleteExtraneous({ context, targets, intoPath, preserve: MaybeArray.toArray(options.preserve ?? []) });

		await pruneEmptyDirectories(intoPath);
		context.logger.info(`Synced ${targets.size} file(s) into ${options.into}${deleted > 0 ? `, deleted ${deleted} extraneous file(s)` : ""}`);
	}
});

interface DeleteExtraneousParams {
	readonly intoPath: string;
	readonly preserve: string[];
	readonly context: RunnerContext;
	readonly targets: Map<string, string>;
}

async function deleteExtraneous({ context, targets, intoPath, preserve }: DeleteExtraneousParams): Promise<number> {
	if (!(await isPathExists(intoPath))) {
		return 0;
	}

	const existingFiles = await fg("**/*", { dot: true, cwd: intoPath, onlyFiles: true });
	let deleted = 0;

	for (const relativePath of existingFiles) {
		const absolutePath = Path.join(intoPath, relativePath);

		if (targets.has(absolutePath) || (preserve.length > 0 && micromatch.isMatch(relativePath, preserve))) {
			continue;
		}

		context.logger.log(`Delete extraneous ${Path.relative(context.workingDir, absolutePath)}`);
		await Fs.rm(absolutePath);
		deleted += 1;
	}

	return deleted;
}

async function pruneEmptyDirectories(intoPath: string): Promise<void> {
	const directories = await fg("**/*", { dot: true, cwd: intoPath, onlyDirectories: true });

	// Deepest first, so emptied parents become removable in the same pass.
	directories.sort((left, right) => right.split("/").length - left.split("/").length);

	for (const directory of directories) {
		try {
			await Fs.rmdir(Path.join(intoPath, directory));
		} catch {
			// Not empty (or already gone) — keep it.
		}
	}
}
