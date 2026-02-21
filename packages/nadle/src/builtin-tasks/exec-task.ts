import { execa, parseCommandString } from "execa";

import type { MaybeArray } from "../core/index.js";
import { defineTask } from "../core/registration/define-task.js";

/**
 * Options for the ExecTask.
 */
export interface ExecTaskOptions {
	/** The command to execute. */
	readonly command: string;
	/** Arguments for the command (array or string). Defaults to none. */
	readonly args?: MaybeArray<string>;
}

/**
 * Task for executing arbitrary shell commands.
 *
 * Supports both string and array arguments.
 */
export const ExecTask = defineTask<ExecTaskOptions>({
	run: async ({ options, context }) => {
		const { args, command } = options;

		const commandArguments = args == null ? [] : typeof args === "string" ? parseCommandString(args) : args;

		context.logger.info(`Running command: ${command} ${commandArguments.join(" ")}`);

		const subprocess = execa(command, commandArguments, { all: true, cwd: context.workingDir, env: { FORCE_COLOR: "1" } });

		subprocess.all?.on("data", (chunk) => {
			context.logger.log(chunk.toString());
		});

		await subprocess;
		context.logger.info(`Run completed successfully.`);
	}
});
