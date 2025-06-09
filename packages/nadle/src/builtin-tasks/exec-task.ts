import { execa, parseCommandString } from "execa";

import { type Task } from "../core/interfaces/task.js";

export const ExecTask: Task<{ command: string; args: string[] | string }> = {
	run: async ({ options, context }) => {
		const { args, command } = options;

		const commandArguments = typeof args === "string" ? parseCommandString(args) : args;

		context.nadle.logger.info(`Running command: ${command} ${commandArguments.join(" ")}`);

		const subprocess = execa(command, commandArguments, { all: true, cwd: context.workingDir, env: { FORCE_COLOR: "1" } });

		subprocess.all?.on("data", (chunk) => {
			context.nadle.logger.log(chunk.toString());
		});

		await subprocess;
		context.nadle.logger.info(`Run completed successfully.`);
	}
};
