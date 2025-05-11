import { execa } from "execa";

import type { Task } from "../core/index.js";

export const PnpmTask: Task<{ args: string[] }> = {
	run: async ({ options, context }) => {
		const { args } = options;

		context.nadle.logger.info(`Running pnpm command: pnpm ${args.join(" ")}`);

		const subprocess = execa("pnpm", args, { stdio: "pipe", env: { FORCE_COLOR: "1" } });

		subprocess.stdout.on("data", (chunk) => {
			context.nadle.logger.log(chunk.toString());
		});

		subprocess.stderr.on("data", (chunk) => {
			context.nadle.logger.error(chunk.toString());
		});

		await subprocess;
		context.nadle.logger.info(`pnpm command completed successfully.`);
	}
};
