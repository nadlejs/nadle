import { use, tasks, definePlugin } from "nadle";

use(
	definePlugin({
		name: "json-plugin",
		reporters: [
			{
				name: "json",
				create: (context) => ({
					onExecutionFinish: () => context.logger.log("JSON_REPORTER_ACTIVE")
				})
			}
		]
	})
);

tasks.register("hello", () => {});
