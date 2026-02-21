import { execa } from "execa";

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

		context.logger.info(`Running node script: node ${options.script} ${args.join(" ")}`);

		const subprocess = execa("node", [options.script, ...args], { all: true, cwd: context.workingDir, env: { FORCE_COLOR: "1" } });

		subprocess.all?.on("data", (chunk) => {
			context.logger.log(chunk.toString());
		});

		await subprocess;

		context.logger.info(`Node script completed successfully.`);
	}
});
