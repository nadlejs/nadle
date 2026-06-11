import type { MaybeArray } from "../core/index.js";
import { runCommand, normalizeArgs } from "./run-command.js";
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

		await runCommand(context, {
			command,
			args: normalizeArgs(args),
			doneMessage: `Run completed successfully.`,
			startMessage: (finalArgs) => `Running command: ${command} ${finalArgs.join(" ")}`
		});
	}
});
