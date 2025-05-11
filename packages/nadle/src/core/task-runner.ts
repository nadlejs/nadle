import c from "tinyrainbow";

import { type Nadle } from "./nadle.js";
import { type Context } from "./types.js";

const executed = new Set<string>();

export class TaskRunner {
	constructor(public readonly nadle: Nadle) {}

	async run(taskName: string, context: Context) {
		const getTask = () => {
			const task = this.nadle.registry.getByName(taskName);

			if (!task) {
				this.nadle.logger.error(`Task ${c.bold(taskName)} not found`);
				throw new Error(`Task "${taskName}" not found`);
			}

			return task;
		};

		const task = getTask();

		const { run, name, configResolver, optionsResolver } = task;

		if (executed.has(name)) {
			return;
		}

		executed.add(name);
		this.nadle.registry.onTaskQueued(name);
		await this.nadle.reporter.onTaskQueued?.(getTask());

		const config = configResolver({ context });
		const options = typeof optionsResolver === "function" ? optionsResolver(context) : optionsResolver;

		for (const dependentTask of config?.dependsOn ?? []) {
			await this.run(dependentTask, context);
		}

		this.nadle.registry.onTaskStart(name);
		await this.nadle.reporter.onTaskStart?.(getTask());

		try {
			await run({ context, options });
			this.nadle.registry.onTaskFinish(name);
			await this.nadle.reporter.onTaskFinish?.(getTask());
		} catch (error) {
			this.nadle.registry.onTaskFail(name);
			await this.nadle.reporter.onTaskFailed?.(getTask());
			throw error;
		}
	}
}
