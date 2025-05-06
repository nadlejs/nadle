import { type TaskContext } from "./types.js";
import { getRegisteredTasks } from "./register-task.js";

const executed = new Set<string>();

/** @internal */
export async function runTask(taskName: string, args: Record<string, any>) {
	const task = getRegisteredTasks().find((t) => t.name === taskName);

	if (!task) {
		throw new Error(`Task "${taskName}" not found`);
	}

	if (executed.has(task.name)) {
		return;
	}

	executed.add(task.name);

	const context: TaskContext = {
		args,
		options: {},
		env: process.env,
		configure: () => {}
	};

	const metadata = task.getMetadata(context);
	context.options = metadata.options || {};

	const deps = metadata.meta?.dependsOn ?? [];

	for (const dep of deps) {
		await runTask(dep, args);
	}

	await task.run(context);
}
