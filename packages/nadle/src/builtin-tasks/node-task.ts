import type { MaybeArray } from "../core/index.js";
import { runCommand, normalizeArgs } from "./run-command.js";
import { defineTask } from "../core/registration/define-task.js";

/**
 * Options for the NodeTask.
 */
export interface NodeTaskOptions {
	/** The script to execute via node. */
	readonly script: string;
	/** Arguments for the script. Defaults to none. */
	readonly args?: MaybeArray<string>;
}

/**
 * Task for running Node.js scripts.
 *
 * Executes `node <script> <args>` in the given working directory.
 */
export const NodeTask = defineTask<NodeTaskOptions>({
	run: async ({ options, context }) => {
		await runCommand(context, {
			command: "node",
			doneMessage: `Node script completed successfully.`,
			args: [options.script, ...normalizeArgs(options.args)],
			startMessage: (finalArgs) => `Running node script: node ${finalArgs.join(" ")}`
		});
	}
});
