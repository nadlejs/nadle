import { runCommand } from "./run-command.js";
import type { MaybeArray } from "../core/index.js";
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
		const args = options.args == null ? [] : typeof options.args === "string" ? [options.args] : options.args;

		await runCommand(context, {
			command: "node",
			args: [options.script, ...args],
			doneMessage: `Node script completed successfully.`,
			startMessage: (finalArgs) => `Running node script: node ${finalArgs.join(" ")}`
		});
	}
});
