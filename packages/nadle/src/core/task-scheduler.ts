import c from "tinyrainbow";

import { type Context } from "./types.js";

export class TaskScheduler {
	// Map between a tasks and
	private dependentsGraph = new Map<string, Set<string>>();
	// Map between a tasks and its indegree
	private indegree = new Map<string, number>();
	private readyTasks = new Set<string>();

	constructor(
		private readonly context: Context,
		taskNames: string[]
	) {
		taskNames.forEach((taskName) => this.analyse(taskName));
	}

	private analyse(taskName: string): void {
		const task = this.context.nadle.registry.findByName(taskName);

		if (!task) {
			this.context.nadle.logger.error(`Task ${c.bold(taskName)} not found`);
			throw new Error(`Task "${taskName}" not found`);
		}

		const dependencies = task.configResolver({ context: this.context }).dependsOn ?? [];

		this.indegree.set(taskName, dependencies.length);

		for (const dependency of dependencies) {
			if (!this.dependentsGraph.has(dependency)) {
				this.dependentsGraph.set(dependency, new Set<string>());
			}

			this.dependentsGraph.get(dependency)?.add(taskName);

			this.analyse(dependency);
		}
	}

	public getReadyTasks(finishedTaskName?: string): Set<string> {
		const nextReadyTasks = new Set<string>();

		if (finishedTaskName === undefined) {
			for (const [taskName, indegree] of this.indegree.entries()) {
				if (indegree === 0) {
					nextReadyTasks.add(taskName);
					this.readyTasks.add(taskName);
				}
			}

			return nextReadyTasks;
		}

		for (const dependentTask of this.dependentsGraph.get(finishedTaskName) ?? []) {
			if (this.readyTasks.has(dependentTask)) {
				continue;
			}

			let indegree = this.indegree.get(dependentTask) || 0;

			if (indegree === 0) {
				this.context.nadle.logger.error(
					`Incorrect state. Expect ${dependentTask} to have indegree > 0 because it depends on the running task ${finishedTaskName}`
				);
				throw new Error(`Incorrect state. Expect ${dependentTask} to have indegree > 0 because it depends on the running task ${finishedTaskName}`);
			}

			this.indegree.set(dependentTask, --indegree);

			if (indegree === 0) {
				nextReadyTasks.add(dependentTask);
				this.readyTasks.add(dependentTask);
			}
		}

		return nextReadyTasks;
	}
}
