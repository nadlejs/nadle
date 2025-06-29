import Path from "node:path";
import Fs from "node:fs/promises";

import fg from "fast-glob";
import micromatch from "micromatch";

import { MaybeArray } from "../core/index.js";
import { isPathExists } from "../core/utilities/fs.js";
import { defineTask } from "../core/registration/define-task.js";

export interface CopyTaskOptions {
	readonly to: string;
	readonly from: string;
	readonly exclude?: MaybeArray<string>;
	readonly include?: MaybeArray<string>;
}

export const CopyTask = defineTask<CopyTaskOptions>({
	run: async ({ options, context }) => {
		const { to, from, exclude = [], include = "**/*" } = options;
		const { logger, workingDir } = context;

		const srcPath = Path.resolve(workingDir, from);
		const destPath = Path.resolve(workingDir, to);

		logger.info(`Copying from ${from} to ${to} within working directory ${workingDir}`);
		const includePatterns = MaybeArray.toArray(include);
		const excludePatterns = MaybeArray.toArray(exclude);

		logger.debug(`Include patterns: ${includePatterns.join(", ")}`);

		if (excludePatterns.length > 0) {
			logger.debug(`Exclude patterns: ${excludePatterns.join(", ")}`);
		}

		const srcPathExists = await isPathExists(srcPath);

		if (!srcPathExists) {
			logger.warn(`File '${srcPath}' does not exist.`);

			return;
		}

		const srcStat = await Fs.stat(srcPath);

		if (srcStat.isDirectory()) {
			await Fs.mkdir(destPath, { recursive: true });

			const files = await fg(includePatterns, {
				dot: true,
				cwd: srcPath,
				onlyFiles: true,
				ignore: excludePatterns
			});

			logger.info(`Found ${files.length} file(s) to copy`);

			for (const file of files) {
				const source = Path.join(srcPath, file);
				const target = Path.join(destPath, file);

				await Fs.mkdir(Path.dirname(target), { recursive: true });
				logger.log(`Copy ${Path.relative(workingDir, source)} -> ${Path.relative(workingDir, target)}`);
				await Fs.cp(source, target);
			}

			logger.info(`Copied directory ${from} to ${to}`);

			return;
		}

		let targetFile = destPath;

		try {
			const destStat = await Fs.stat(destPath);

			if (destStat.isDirectory()) {
				targetFile = Path.join(destPath, Path.basename(srcPath));
			}
		} catch {
			if (to.endsWith(Path.sep)) {
				targetFile = Path.join(destPath, Path.basename(srcPath));
			}
		}

		if (
			!micromatch.isMatch(Path.basename(srcPath), includePatterns) ||
			(excludePatterns.length > 0 && micromatch.isMatch(Path.basename(srcPath), excludePatterns))
		) {
			return;
		}

		await Fs.mkdir(Path.dirname(targetFile), { recursive: true });
		logger.log(`Copy ${Path.relative(workingDir, srcPath)} -> ${Path.relative(workingDir, targetFile)}`);
		await Fs.cp(srcPath, targetFile);
		logger.info(`Copied file ${from} to ${to}`);
	}
});
