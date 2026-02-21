import { execa } from "execa";

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

		context.logger.info(`Running pnpm exec command: pnpm exec ${options.command} ${args.join(" ")}`);

		const subprocess = execa("pnpm", ["exec", options.command, ...args], { all: true, cwd: context.workingDir, env: { FORCE_COLOR: "1" } });

		subprocess.all?.on("data", (chunk) => {
			context.logger.log(chunk.toString());
		});

		await subprocess;

		context.logger.info(`pnpm exec command completed successfully.`);
	}
});
