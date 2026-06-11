import Path from "node:path";
import Fs from "node:fs/promises";

import { type MaybeArray } from "../core/index.js";
import { isPathExists } from "../core/utilities/fs.js";
import { type RunnerContext } from "../core/interfaces/task.js";
import { defineTask } from "../core/registration/define-task.js";
import { TaskExecutionError } from "../core/utilities/nadle-error.js";
import { type SelectedFile, type FileSelection, resolveFileSelections } from "./file-selection.js";

/**
 * Options for the CopyTask.
 */
export interface CopyTaskOptions {
	/** Destination directory. Created if missing. */
	readonly into: string;
	/** Fail when a source path is missing or no files match. Defaults to false. */
	readonly strict?: boolean;
	/** Copy all files directly into `into`, dropping source directory structure. */
	readonly flatten?: boolean;
	/** Default include patterns for directory selections without their own. */
	readonly include?: MaybeArray<string>;
	/** Default exclude patterns for directory selections without their own. */
	readonly exclude?: MaybeArray<string>;
	/** Source file(s), directory(ies), or selector(s) with glob patterns. */
	readonly from: MaybeArray<FileSelection>;
	/** Renames by exact base name, e.g. `{ "config.dev.json": "config.json" }`. */
	readonly rename?: Record<string, string>;
	/** Behavior when a destination file already exists. Defaults to `replace`. */
	readonly overwrite?: "error" | "replace" | "skip";
}

/**
 * Task for copying files and directories.
 *
 * Sources are files, directories, or glob selectors; the destination (`into`) is
 * always a directory. Supports flattening, renaming, and overwrite policies.
 */
export const CopyTask = defineTask<CopyTaskOptions>({
	run: async ({ options, context }) => {
		if (options.into === undefined) {
			throw new TaskExecutionError(`CopyTask requires the 'into' option.`);
		}

		const files = await resolveFileSelections({
			logger: context.logger,
			selections: options.from,
			workingDir: context.workingDir,
			strict: options.strict ?? false,
			defaultInclude: options.include,
			defaultExclude: options.exclude
		});

		const intoPath = Path.resolve(context.workingDir, options.into);
		const targets = computeTargets(files, intoPath, options);

		await copyFiles(targets, options.overwrite ?? "replace", context);
		context.logger.info(`Copied ${targets.size} file(s) into ${options.into}`);
	}
});

function computeTargets(files: SelectedFile[], intoPath: string, options: Pick<CopyTaskOptions, "rename" | "flatten">): Map<string, string> {
	const targets = new Map<string, string>();

	for (const file of files) {
		let relativePath = options.flatten ? Path.basename(file.relativePath) : file.relativePath;
		const renamed = options.rename?.[Path.basename(relativePath)];

		if (renamed !== undefined) {
			relativePath = Path.join(Path.dirname(relativePath), renamed);
		}

		const target = Path.join(intoPath, relativePath);
		const existingSource = targets.get(target);

		if (existingSource !== undefined) {
			throw new TaskExecutionError(`Both '${existingSource}' and '${file.source}' map to the same destination '${target}'.`);
		}

		targets.set(target, file.source);
	}

	return targets;
}

async function copyFiles(targets: Map<string, string>, overwrite: "error" | "replace" | "skip", context: RunnerContext): Promise<void> {
	for (const [target, source] of targets) {
		if (overwrite !== "replace" && (await isPathExists(target))) {
			if (overwrite === "error") {
				throw new TaskExecutionError(`Destination '${target}' already exists.`);
			}

			context.logger.info(`Skip existing ${Path.relative(context.workingDir, target)}`);
			continue;
		}

		await Fs.mkdir(Path.dirname(target), { recursive: true });
		context.logger.log(`Copy ${Path.relative(context.workingDir, source)} -> ${Path.relative(context.workingDir, target)}`);
		await Fs.cp(source, target);
	}
}
