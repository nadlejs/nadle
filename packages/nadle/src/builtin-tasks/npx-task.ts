import { execa } from "execa";

import { MaybeArray } from "../core/index.js";
import { defineTask } from "../core/registration/define-task.js";

/**
 * Options for the NpxTask.
 */
export interface NpxTaskOptions {
	/** The command to execute via npx. */
	readonly command: string;
	/** Arguments for the command. */
	readonly args: MaybeArray<string>;
}

/**
 * Task for running locally-installed package binaries via npx.
 *
 * Executes `npx <command> <args>` in the given working directory.
 */
export const NpxTask = defineTask<NpxTaskOptions>({
	run: async ({ options, context }) => {
		const args = MaybeArray.toArray(options.args);

		context.logger.info(`Running npx command: npx ${options.command} ${args.join(" ")}`);

		const subprocess = execa("npx", [options.command, ...args], { all: true, cwd: context.workingDir, env: { FORCE_COLOR: "1" } });

		subprocess.all?.on("data", (chunk) => {
			context.logger.log(chunk.toString());
		});

		await subprocess;

		context.logger.info(`npx command completed successfully.`);
	}
});
