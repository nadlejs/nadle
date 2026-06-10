import { runCommand } from "./run-command.js";
import { MaybeArray } from "../core/index.js";
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
		const args = options.args == null ? [] : MaybeArray.toArray(options.args);

		await runCommand(context, {
			command: "npx",
			args: [options.command, ...args],
			doneMessage: `npx command completed successfully.`,
			startMessage: (finalArgs) => `Running npx command: npx ${finalArgs.join(" ")}`
		});
	}
});
