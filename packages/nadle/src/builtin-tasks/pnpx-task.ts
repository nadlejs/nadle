import { type MaybeArray } from "../core/index.js";
import { runCommand, normalizeArgs } from "./run-command.js";
import { defineTask } from "../core/registration/define-task.js";

/**
 * Options for the PnpxTask.
 */
export interface PnpxTaskOptions {
	/** The command to execute via pnpm exec. */
	readonly command: string;
	/** Arguments for the command. Defaults to none. */
	readonly args?: MaybeArray<string>;
}

/**
 * Task for running locally-installed package binaries via pnpm exec.
 *
 * Executes `pnpm exec <command> <args>` in the given working directory.
 */
export const PnpxTask = defineTask<PnpxTaskOptions>({
	run: async ({ options, context }) => {
		await runCommand(context, {
			command: "pnpm",
			doneMessage: `pnpm exec command completed successfully.`,
			args: ["exec", options.command, ...normalizeArgs(options.args)],
			startMessage: (finalArgs) => `Running pnpm exec command: pnpm ${finalArgs.join(" ")}`
		});
	}
});
