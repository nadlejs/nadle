import Path from "node:path";
import Fs from "node:fs/promises";

import { zipSync } from "fflate";

import { type MaybeArray } from "../core/index.js";
import { defineTask } from "../core/registration/define-task.js";
import { TaskExecutionError } from "../core/utilities/nadle-error.js";
import { type FileSelection, resolveFileSelections } from "./file-selection.js";

/**
 * Options for the ZipTask.
 */
export interface ZipTaskOptions {
	/** Path of the zip archive to create (relative to working directory). */
	readonly archive: string;
	/** Entry-name prefix, e.g. `"bundle"` stores files as `bundle/...`. */
	readonly prefix?: string;
	/** Fail when a source path is missing or no files match. Defaults to false. */
	readonly strict?: boolean;
	/** Default include patterns for directory selections without their own. */
	readonly include?: MaybeArray<string>;
	/** Default exclude patterns for directory selections without their own. */
	readonly exclude?: MaybeArray<string>;
	/** Source file(s), directory(ies), or selector(s) with glob patterns. */
	readonly from: MaybeArray<FileSelection>;
}

/**
 * Task for creating a zip archive from selected files.
 *
 * Entry names are the selection-relative paths, optionally under `prefix`.
 */
export const ZipTask = defineTask<ZipTaskOptions>({
	run: async ({ options, context }) => {
		const files = await resolveFileSelections({
			logger: context.logger,
			selections: options.from,
			workingDir: context.workingDir,
			strict: options.strict ?? false,
			defaultInclude: options.include,
			defaultExclude: options.exclude
		});

		const entries: Record<string, Uint8Array> = {};

		for (const file of files) {
			const entryName = options.prefix ? Path.posix.join(options.prefix, toPosixPath(file.relativePath)) : toPosixPath(file.relativePath);

			if (entries[entryName] !== undefined) {
				throw new TaskExecutionError(`Multiple source files map to the same archive entry '${entryName}'.`);
			}

			entries[entryName] = await Fs.readFile(file.source);
		}

		const archivePath = Path.resolve(context.workingDir, options.archive);

		await Fs.mkdir(Path.dirname(archivePath), { recursive: true });
		await Fs.writeFile(archivePath, zipSync(entries));
		context.logger.info(`Zipped ${files.length} file(s) into ${options.archive}`);
	}
});

function toPosixPath(filePath: string): string {
	return filePath.split(Path.sep).join("/");
}
