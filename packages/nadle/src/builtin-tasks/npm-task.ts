import { execa } from "execa";

import { MaybeArray } from "../core/index.js";
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
		const args = MaybeArray.toArray(options.args);

		context.logger.info(`Running npm command: npm ${args.join(" ")}`);

		const subprocess = execa("npm", args, { all: true, cwd: context.workingDir, env: { FORCE_COLOR: "1" } });

		subprocess.all?.on("data", (chunk) => {
			context.logger.log(chunk.toString());
		});

		await subprocess;

		context.logger.info(`npm command completed successfully.`);
	}
});
