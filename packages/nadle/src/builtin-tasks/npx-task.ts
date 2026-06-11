import { type MaybeArray } from "../core/index.js";
import { runCommand, normalizeArgs } from "./run-command.js";
import { defineTask } from "../core/registration/define-task.js";

/**
 * Options for the NpxTask.
 */
export interface NpxTaskOptions {
	/** The command to execute via npx. */
	readonly command: string;
	/** Arguments for the command. Defaults to none. */
	readonly args?: MaybeArray<string>;
}

/**
 * Task for running locally-installed package binaries via npx.
 *
 * Executes `npx <command> <args>` in the given working directory.
 */
export const NpxTask = defineTask<NpxTaskOptions>({
	run: async ({ options, context }) => {
		await runCommand(context, {
			command: "npx",
			doneMessage: `npx command completed successfully.`,
			args: [options.command, ...normalizeArgs(options.args)],
			startMessage: (finalArgs) => `Running npx command: npx ${finalArgs.join(" ")}`
		});
	}
});
