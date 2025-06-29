import { glob } from "glob";
import { rimraf, type RimrafAsyncOptions } from "rimraf";

import { normalizeGlobPath } from "../core/utilities/utils.js";
import { defineTask } from "../core/registration/define-task.js";

export interface DeleteTaskOptions extends RimrafAsyncOptions {
	readonly paths: string | string[];
}

export const DeleteTask = defineTask<DeleteTaskOptions>({
	run: async ({ options, context }) => {
		const { paths, ...restOptions } = options;
		const { workingDir } = context;

		const matchPaths = await glob(paths, { cwd: workingDir });
		context.logger.info(`Current working dir: ${workingDir}`);
		context.logger.info("Deleting paths:", matchPaths.map(normalizeGlobPath).join(", "));

		await rimraf(paths, { ...restOptions, glob: { cwd: workingDir, ...restOptions } });
	}
});
