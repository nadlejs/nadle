import Path from "node:path";
import Fs from "node:fs/promises";

import { unzipSync } from "fflate";
import micromatch from "micromatch";

import { MaybeArray } from "../core/index.js";
import { isPathExists } from "../core/utilities/fs.js";
import { defineTask } from "../core/registration/define-task.js";
import { TaskExecutionError } from "../core/utilities/nadle-error.js";

/**
 * Options for the UnzipTask.
 */
export interface UnzipTaskOptions {
	/** Destination directory. Created if missing. */
	readonly into: string;
	/** Path of the zip archive to extract (relative to working directory). */
	readonly archive: string;
	/** Glob patterns selecting which entries to extract. Defaults to all. */
	readonly include?: MaybeArray<string>;
}

/**
 * Task for extracting a zip archive into a directory.
 */
export const UnzipTask = defineTask<UnzipTaskOptions>({
	run: async ({ options, context }) => {
		const archivePath = Path.resolve(context.workingDir, options.archive);

		if (!(await isPathExists(archivePath))) {
			throw new TaskExecutionError(`Archive '${archivePath}' does not exist.`);
		}

		const intoPath = Path.resolve(context.workingDir, options.into);
		const include = MaybeArray.toArray(options.include ?? []);
		const entries = unzipSync(await Fs.readFile(archivePath));
		let extracted = 0;

		for (const [entryName, content] of Object.entries(entries)) {
			if (entryName.endsWith("/") || (include.length > 0 && !micromatch.isMatch(entryName, include))) {
				continue;
			}

			const target = Path.join(intoPath, entryName);

			// Zip entry names are attacker-controllable; never write outside `into`.
			if (Path.relative(intoPath, target).startsWith("..")) {
				throw new TaskExecutionError(`Archive entry '${entryName}' escapes the destination directory.`);
			}

			await Fs.mkdir(Path.dirname(target), { recursive: true });
			await Fs.writeFile(target, content);
			extracted += 1;
		}

		context.logger.info(`Extracted ${extracted} entry(ies) from ${options.archive} into ${options.into}`);
	}
});
