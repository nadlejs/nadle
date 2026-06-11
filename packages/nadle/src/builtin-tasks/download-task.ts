import Path from "node:path";
import Crypto from "node:crypto";
import Fs from "node:fs/promises";

import { isPathExists } from "../core/utilities/fs.js";
import { defineTask } from "../core/registration/define-task.js";
import { TaskExecutionError } from "../core/utilities/nadle-error.js";

/**
 * Options for the DownloadTask.
 */
export interface DownloadTaskOptions {
	/** The URL to download. */
	readonly url: string;
	/** Destination directory. Created if missing. */
	readonly into: string;
	/** Expected SHA-256 hex digest; the task fails on mismatch. */
	readonly sha256?: string;
	/** Destination file name. Defaults to the last segment of the URL path. */
	readonly filename?: string;
}

/**
 * Task for downloading a file over HTTP(S).
 *
 * When `sha256` is given and the destination file already exists with a matching
 * digest, the download is skipped. A digest mismatch after download fails the task
 * and removes the file.
 */
export const DownloadTask = defineTask<DownloadTaskOptions>({
	run: async ({ options, context }) => {
		const filename = options.filename ?? Path.posix.basename(new URL(options.url).pathname);

		if (filename === "") {
			throw new TaskExecutionError(`Cannot derive a file name from '${options.url}'. Set the 'filename' option.`);
		}

		const target = Path.resolve(context.workingDir, options.into, filename);

		if (options.sha256 !== undefined && (await isPathExists(target)) && (await sha256Of(target)) === options.sha256.toLowerCase()) {
			context.logger.info(`Skip download: ${filename} already matches the expected digest.`);

			return;
		}

		context.logger.info(`Downloading ${options.url}`);
		const response = await fetch(options.url);

		if (!response.ok) {
			throw new TaskExecutionError(`Download of '${options.url}' failed with status ${response.status}.`);
		}

		await Fs.mkdir(Path.dirname(target), { recursive: true });
		await Fs.writeFile(target, new Uint8Array(await response.arrayBuffer()));

		if (options.sha256 !== undefined) {
			const actual = await sha256Of(target);

			if (actual !== options.sha256.toLowerCase()) {
				await Fs.rm(target);
				throw new TaskExecutionError(`Digest mismatch for '${options.url}': expected ${options.sha256.toLowerCase()}, got ${actual}.`);
			}
		}

		context.logger.info(`Downloaded ${options.url} to ${Path.relative(context.workingDir, target)}`);
	}
});

async function sha256Of(filePath: string): Promise<string> {
	return Crypto.createHash("sha256")
		.update(await Fs.readFile(filePath))
		.digest("hex");
}
