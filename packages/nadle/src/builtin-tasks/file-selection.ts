import Path from "node:path";
import Fs from "node:fs/promises";

import fg from "fast-glob";

import { MaybeArray } from "../core/index.js";
import { isPathExists } from "../core/utilities/fs.js";
import { type Logger } from "../core/interfaces/logger.js";
import { TaskExecutionError } from "../core/utilities/nadle-error.js";

/**
 * Selects files relative to a base directory using glob patterns.
 *
 * @public
 */
export interface FileSelector {
	/** Base directory the patterns are matched against. */
	readonly dir: string;
	/** Glob patterns to include. Defaults to all files. */
	readonly include?: MaybeArray<string>;
	/** Glob patterns to exclude. */
	readonly exclude?: MaybeArray<string>;
}

/**
 * A source of files for file-operation tasks: a path to a file or directory,
 * or a {@link FileSelector} with glob patterns.
 *
 * @public
 */
export type FileSelection = string | FileSelector;

/** A file resolved from a selection: absolute source path plus destination-relative path. */
interface SelectedFile {
	readonly source: string;
	readonly relativePath: string;
}

interface ResolveParams {
	readonly logger: Logger;
	readonly strict: boolean;
	readonly workingDir: string;
	/** Fallback include patterns for selections that do not declare their own. */
	readonly defaultInclude?: MaybeArray<string>;
	/** Fallback exclude patterns for selections that do not declare their own. */
	readonly defaultExclude?: MaybeArray<string>;
	readonly selections: MaybeArray<FileSelection>;
}

/**
 * Resolves file selections to concrete files. A string selection pointing to a file
 * yields that file; one pointing to a directory selects files inside it by pattern.
 * Missing sources fail in strict mode and log a warning otherwise.
 */
export async function resolveFileSelections(params: ResolveParams): Promise<SelectedFile[]> {
	const selected: SelectedFile[] = [];

	for (const selection of MaybeArray.toArray(params.selections)) {
		selected.push(...(await resolveSelection(selection, params)));
	}

	if (params.strict && selected.length === 0) {
		throw new TaskExecutionError(`No files matched the configured sources.`);
	}

	return selected;
}

async function resolveSelection(selection: FileSelection, params: ResolveParams): Promise<SelectedFile[]> {
	const selector = typeof selection === "string" ? undefined : selection;
	const sourcePath = Path.resolve(params.workingDir, selector?.dir ?? (selection as string));

	if (!(await isPathExists(sourcePath))) {
		if (params.strict) {
			throw new TaskExecutionError(`Source path '${sourcePath}' does not exist.`);
		}

		params.logger.warn(`Source path '${sourcePath}' does not exist. Skipping.`);

		return [];
	}

	if (selector === undefined && !(await Fs.stat(sourcePath)).isDirectory()) {
		return [{ source: sourcePath, relativePath: Path.basename(sourcePath) }];
	}

	const { include, exclude } = resolvePatterns(selector, params);
	const files = await fg(include, { dot: true, cwd: sourcePath, ignore: exclude, onlyFiles: true });

	return files.map((file) => ({ relativePath: file, source: Path.join(sourcePath, file) }));
}

function resolvePatterns(selector: FileSelector | undefined, params: ResolveParams): { include: string[]; exclude: string[] } {
	return {
		exclude: MaybeArray.toArray(selector?.exclude ?? params.defaultExclude ?? []),
		include: MaybeArray.toArray(selector?.include ?? params.defaultInclude ?? "**/*")
	};
}
