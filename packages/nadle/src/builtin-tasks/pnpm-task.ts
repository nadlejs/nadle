import { MaybeArray } from "../core/index.js";
import { runCommand, normalizeArgs } from "./run-command.js";
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

		await runCommand(context, {
			command: "pnpm",
			doneMessage: `pnpm command completed successfully.`,
			args: [...filterArgs, ...normalizeArgs(options.args)],
			startMessage: (finalArgs) => `Running pnpm command: pnpm ${finalArgs.join(" ")}`
		});
	}
});
