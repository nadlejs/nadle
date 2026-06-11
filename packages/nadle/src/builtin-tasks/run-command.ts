import { execa, parseCommandString } from "execa";

import { type MaybeArray } from "../core/index.js";
import { type RunnerContext } from "../core/interfaces/task.js";
import { TaskExecutionError } from "../core/utilities/nadle-error.js";

/**
 * Normalizes a task's `args` option: a string is split into arguments on spaces
 * (backslash-escaped spaces are preserved); an array is taken as-is. One semantic
 * for all exec-based builtin tasks.
 */
export function normalizeArgs(args: MaybeArray<string> | undefined): string[] {
	return args == null ? [] : typeof args === "string" ? parseCommandString(args) : [...args];
}

interface RunCommandParams {
	/** The binary to spawn. */
	readonly command: string;
	/** Info log line emitted after the command completes successfully. */
	readonly doneMessage: string;
	/** Configured arguments; the runner context's passthrough args are appended after them. */
	readonly args: readonly string[];
	/** Builds the info log line emitted before spawning, from the final argument list. */
	readonly startMessage: (finalArgs: readonly string[]) => string;
}

/**
 * Shared runner for exec-based builtin tasks: appends passthrough args, spawns the
 * command in the task's working directory with forced color, streams combined
 * output to the task logger, and wraps failures in a TaskExecutionError.
 */
export async function runCommand(context: RunnerContext, { args, command, doneMessage, startMessage }: RunCommandParams): Promise<void> {
	const finalArgs = [...args, ...context.passthroughArgs];

	context.logger.info(startMessage(finalArgs));

	const subprocess = execa(command, finalArgs, { all: true, cwd: context.workingDir, env: { FORCE_COLOR: "1" } });

	subprocess.all?.on("data", (chunk) => {
		context.logger.log(chunk.toString());
	});

	try {
		await subprocess;
	} catch (error) {
		const exitCode = (error as { exitCode?: number }).exitCode;

		throw new TaskExecutionError(`Command failed${exitCode !== undefined ? ` with exit code ${exitCode}` : ""}: ${command} ${finalArgs.join(" ")}`, {
			cause: error
		});
	}

	context.logger.info(doneMessage);
}
