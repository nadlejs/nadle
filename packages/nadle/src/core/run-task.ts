import { type Context } from "./types.js";
import { getRegisteredTasks } from "./register-task.js";

const executed = new Set<string>();

/** @internal */
export async function runTask(taskName: string) {
	const task = getRegisteredTasks().find((t) => t.name === taskName);

	if (!task) {
		throw new Error(`Task "${taskName}" not found`);
	}

	const { run, name, configResolver, optionsResolver } = task;

	if (executed.has(name)) {
		return;
	}

	executed.add(name);

	const context: Context = { env: process.env };

	const config = configResolver({ context });
	const options = typeof optionsResolver === "function" ? optionsResolver(context) : optionsResolver;

	for (const dependentTask of config?.dependsOn ?? []) {
		await runTask(dependentTask);
	}

	await run({ context, options });
}
