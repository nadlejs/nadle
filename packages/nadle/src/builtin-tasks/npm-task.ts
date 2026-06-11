import { type MaybeArray } from "../core/index.js";
import { runCommand, normalizeArgs } from "./run-command.js";
import { defineTask } from "../core/registration/define-task.js";

/**
 * Options for the NpmTask.
 */
export interface NpmTaskOptions {
	/** Arguments to pass to the npm CLI. */
	readonly args: MaybeArray<string>;
}

/**
 * Task for running npm commands.
 *
 * Executes npm with the provided arguments in the given working directory.
 */
export const NpmTask = defineTask<NpmTaskOptions>({
	run: async ({ options, context }) => {
		await runCommand(context, {
			command: "npm",
			args: normalizeArgs(options.args),
			doneMessage: `npm command completed successfully.`,
			startMessage: (finalArgs) => `Running npm command: npm ${finalArgs.join(" ")}`
		});
	}
});
