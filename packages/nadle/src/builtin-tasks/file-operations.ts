import Path from "node:path";

import { type MaybeArray } from "../core/index.js";
import { isPathExists } from "../core/utilities/fs.js";
import { type RunnerContext } from "../core/interfaces/task.js";
import { TaskExecutionError } from "../core/utilities/nadle-error.js";
import { type FileSelection, resolveFileSelections } from "./file-selection.js";

/**
 * Options shared by the file-operation tasks (Copy, Move, Sync).
 *
 * @public
 */
export interface FileOperationOptions {
	/** Destination directory. Created if missing. */
	readonly into: string;
	/** Fail when a source path is missing or no files match. Defaults to false. */
	readonly strict?: boolean;
	/** Place all files directly into `into`, dropping source directory structure. */
	readonly flatten?: boolean;
	/** Default include patterns for directory selections without their own. */
	readonly include?: MaybeArray<string>;
	/** Default exclude patterns for directory selections without their own. */
	readonly exclude?: MaybeArray<string>;
	/** Source file(s), directory(ies), or selector(s) with glob patterns. */
	readonly from: MaybeArray<FileSelection>;
	/** Renames by exact base name, e.g. `{ "config.dev.json": "config.json" }`. */
	readonly rename?: Record<string, string>;
}

/** Overwrite policy applied per existing destination file. */
export type OverwritePolicy = "error" | "replace" | "skip";

/**
 * Resolves the task's selections and maps every selected file to its absolute
 * destination path under `into`, applying `flatten` and `rename`. Fails when two
 * sources map to the same destination.
 */
export async function resolveTargets(options: FileOperationOptions, context: RunnerContext): Promise<Map<string, string>> {
	if (options.into === undefined) {
		throw new TaskExecutionError(`The 'into' option is required.`);
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
	const targets = new Map<string, string>();

	for (const file of files) {
		const target = Path.join(intoPath, computeRelativePath(file.relativePath, options));
		const existingSource = targets.get(target);

		if (existingSource !== undefined) {
			throw new TaskExecutionError(`Both '${existingSource}' and '${file.source}' map to the same destination '${target}'.`);
		}

		targets.set(target, file.source);
	}

	return targets;
}

function computeRelativePath(relativePath: string, options: Pick<FileOperationOptions, "rename" | "flatten">): string {
	const flattened = options.flatten ? Path.basename(relativePath) : relativePath;
	const renamed = options.rename?.[Path.basename(flattened)];

	return renamed === undefined ? flattened : Path.join(Path.dirname(flattened), renamed);
}

/**
 * Applies the overwrite policy for one destination file: returns true when the
 * write should proceed, false when it should be skipped, and throws on `error`.
 */
export async function shouldWrite(target: string, overwrite: OverwritePolicy, context: RunnerContext): Promise<boolean> {
	if (overwrite === "replace" || !(await isPathExists(target))) {
		return true;
	}

	if (overwrite === "error") {
		throw new TaskExecutionError(`Destination '${target}' already exists.`);
	}

	context.logger.info(`Skip existing ${Path.relative(context.workingDir, target)}`);

	return false;
}
