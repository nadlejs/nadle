import { execa } from "execa";

import { MaybeArray } from "../core/index.js";
import { defineTask } from "../core/registration/define-task.js";

/**
 * Options for the PnpmTask.
 */
export interface PnpmTaskOptions {
	/** Arguments to pass to the pnpm CLI. */
	readonly args: MaybeArray<string>;
	/** Workspace package(s) to scope the command to, passed as pnpm `--filter` flags. */
	readonly filter?: MaybeArray<string>;
}

/**
 * Task for running pnpm commands.
 *
 * Executes pnpm with the provided arguments in the given working directory.
 * When `filter` is set, each value is prepended as a `--filter <value>` flag so
 * the command runs only in the matching workspace package(s).
 */
export const PnpmTask = defineTask<PnpmTaskOptions>({
	run: async ({ options, context }) => {
		const filterArgs = MaybeArray.toArray(options.filter ?? []).flatMap((filter) => ["--filter", filter]);
		const args = [...filterArgs, ...MaybeArray.toArray(options.args), ...context.passthroughArgs];

		context.logger.info(`Running pnpm command: pnpm ${args.join(" ")}`);

		const subprocess = execa("pnpm", args, { all: true, cwd: context.workingDir, env: { FORCE_COLOR: "1" } });

		subprocess.all?.on("data", (chunk) => {
			context.logger.log(chunk.toString());
		});

		await subprocess;

		context.logger.info(`pnpm command completed successfully.`);
	}
});
