import { execa, parseCommandString } from "execa";

import { defineTask } from "../core/registration/define-task.js";

export interface ExecTaskOptions {
	readonly command: string;
	readonly args: string[] | string;
}

export const ExecTask = defineTask<ExecTaskOptions>({
	run: async ({ options, context }) => {
		const { args, command } = options;

		const commandArguments = typeof args === "string" ? parseCommandString(args) : args;

		context.logger.info(`Running command: ${command} ${commandArguments.join(" ")}`);

		const subprocess = execa(command, commandArguments, { all: true, cwd: context.workingDir, env: { FORCE_COLOR: "1" } });

		subprocess.all?.on("data", (chunk) => {
			context.logger.log(chunk.toString());
		});

		await subprocess;
		context.logger.info(`Run completed successfully.`);
	}
});
