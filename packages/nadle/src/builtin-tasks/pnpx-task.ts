import { runCommand } from "./run-command.js";
import { MaybeArray } from "../core/index.js";
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
		const args = options.args == null ? [] : MaybeArray.toArray(options.args);

		await runCommand(context, {
			command: "pnpm",
			args: ["exec", options.command, ...args],
			doneMessage: `pnpm exec command completed successfully.`,
			startMessage: (finalArgs) => `Running pnpm exec command: pnpm ${finalArgs.join(" ")}`
		});
	}
});
