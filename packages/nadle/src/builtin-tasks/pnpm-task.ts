import { execa } from "execa";

import { defineTask } from "../core/registration/define-task.js";

export interface PnpmTaskOptions {
	readonly args: string[];
}

export const PnpmTask = defineTask<PnpmTaskOptions>({
	run: async ({ options, context }) => {
		const { args } = options;

		context.logger.info(`Running pnpm command: pnpm ${args.join(" ")}`);

		const subprocess = execa("pnpm", args, { all: true, cwd: context.workingDir, env: { FORCE_COLOR: "1" } });

		subprocess.all?.on("data", (chunk) => {
			context.logger.log(chunk.toString());
		});

		await subprocess;

		context.logger.info(`pnpm command completed successfully.`);
	}
});
