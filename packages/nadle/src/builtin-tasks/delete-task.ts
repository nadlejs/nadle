import { glob } from "glob";
import { rimraf, type RimrafAsyncOptions } from "rimraf";

import { type Task } from "../core/interfaces/task.js";
import { normalizeGlobPath } from "../core/utilities/utils.js";

export interface DeleteTaskOptions extends RimrafAsyncOptions {
	readonly paths: string | string[];
}

export const DeleteTask: Task<DeleteTaskOptions> = {
	run: async ({ options, context }) => {
		const { paths, ...restOptions } = options;
		const { workingDir } = context;

		const matchPaths = await glob(paths, { cwd: workingDir });
		context.nadle.logger.info(`Current working dir: ${workingDir}`);
		context.nadle.logger.info("Deleting paths:", matchPaths.map(normalizeGlobPath).join(", "));

		await rimraf(paths, { ...restOptions, glob: { cwd: workingDir, ...restOptions } });
	}
};
