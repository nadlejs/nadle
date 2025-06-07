import c from "tinyrainbow";

import { type Context } from "./types.js";
import { RIGHT_ARROW } from "./constants.js";

export class TaskScheduler {
	// Map between a task and the set of tasks that depend on it
	private readonly dependentsGraph = new Map<string, Set<string>>();

	// Map between a task and the set of tasks that it depends on
	private readonly dependencyGraph = new Map<string, Set<string>>();

	// Map between a task and the set of tasks that it depends on transitively
	private readonly transitiveDependencyGraph = new Map<string, Set<string>>();

	// Map between a tasks and its indegree
	private readonly indegree = new Map<string, number>();

	// Set of tasks that are ready to be executed
	private readonly readyTasks = new Set<string>();

	private runningRootTask: string | undefined = undefined;

	constructor(
		private readonly context: Context,
		private readonly taskNames: string[]
	) {
		taskNames.forEach((taskName) => this.analyze(taskName));
		taskNames.forEach((taskName) => this.detectCycle(taskName, [taskName]));

		this.context.nadle.logger.debug(c.yellow("[Scheduler]"), `transitiveDependencyGraph`, this.transitiveDependencyGraph);
		this.context.nadle.logger.debug(c.yellow("[Scheduler]"), `dependencyGraph`, this.dependencyGraph);

		if (context.nadle.options.sequence) {
			this.runningRootTask = taskNames[0];
		}
	}

	private detectCycle(taskName: string, paths: string[]) {
		for (const dependency of this.dependencyGraph.get(taskName) ?? []) {
			const startTaskIndex = paths.indexOf(dependency);

			if (startTaskIndex !== -1) {
				const cyclePath = [...paths.slice(startTaskIndex), dependency].map(c.bold).join(` ${RIGHT_ARROW} `);
				this.context.nadle.logger.error(`Cycle detected: ${cyclePath}`);
				throw new Error(`Cycle detected: ${cyclePath}`);
			}

			this.detectCycle(dependency, [...paths, dependency]);
		}
	}

	private analyze(taskName: string): void {
		if (this.dependencyGraph.has(taskName)) {
			return;
		}

		const task = this.context.nadle.registry.getByName(taskName);

		const dependencies = new Set(task.configResolver({ context: this.context }).dependsOn ?? []);

		this.dependencyGraph.set(taskName, dependencies);
		this.indegree.set(taskName, dependencies.size);

		const transitiveDependencies = new Set(dependencies);

		for (const dependency of dependencies) {
			if (!this.dependentsGraph.has(dependency)) {
				this.dependentsGraph.set(dependency, new Set<string>());
			}

			this.dependentsGraph.get(dependency)?.add(taskName);

			this.analyze(dependency);
			this.transitiveDependencyGraph.get(dependency)?.forEach((d) => transitiveDependencies.add(d));
		}

		this.transitiveDependencyGraph.set(taskName, transitiveDependencies);
	}

	public get scheduledTask(): string[] {
		return Array.from(this.dependencyGraph.keys());
	}

	private getIndegreeEntries() {
		const runningRootTask = this.runningRootTask;

		if (!runningRootTask) {
			return this.indegree.entries();
		}

		return new Map(
			Array.from(this.indegree.entries()).filter(
				([taskName]) => taskName === runningRootTask || this.transitiveDependencyGraph.get(runningRootTask)?.has(taskName)
			)
		);
	}

	private isBelongToRootTaskTree(taskName: string): boolean {
		if (!this.runningRootTask) {
			return true;
		}

		return (taskName === this.runningRootTask || this.transitiveDependencyGraph.get(this.runningRootTask)?.has(taskName)) ?? false;
	}

	private getNextRootTask(): string | undefined {
		if (this.runningRootTask === undefined) {
			return undefined;
		}

		return this.taskNames[this.taskNames.indexOf(this.runningRootTask) + 1];
	}

	public getReadyTasks(finishedTaskName?: string): Set<string> {
		this.context.nadle.logger.debug(c.yellow("[Scheduler]"), `runningRoot = ${this.runningRootTask}, finishedTaskName = ${finishedTaskName}`);
		const nextReadyTasks = new Set<string>();

		if (finishedTaskName === undefined) {
			for (const [taskName, indegree] of this.getIndegreeEntries()) {
				this.context.nadle.logger.debug(c.yellow("[Scheduler]"), `taskName = ${taskName}, indegree = ${indegree}`);

				if (indegree === 0 && !this.readyTasks.has(taskName)) {
					nextReadyTasks.add(taskName);
					this.readyTasks.add(taskName);
				}
			}

			this.context.nadle.logger.debug(c.yellow("[Scheduler]"), `Next tasks = ${Array.from(nextReadyTasks).join(",")}`);

			return nextReadyTasks;
		}

		for (const dependentTask of this.dependentsGraph.get(finishedTaskName) ?? []) {
			if (this.readyTasks.has(dependentTask)) {
				continue;
			}

			let indegree = this.indegree.get(dependentTask) || 0;

			if (indegree === 0) {
				const message = `Incorrect state. Expect ${dependentTask} to have indegree > 0 because it depends on the running task ${finishedTaskName}`;
				this.context.nadle.logger.error(message);
				throw new Error(message);
			}

			this.indegree.set(dependentTask, --indegree);

			if (indegree === 0 && this.isBelongToRootTaskTree(dependentTask)) {
				nextReadyTasks.add(dependentTask);
				this.readyTasks.add(dependentTask);
			}
		}

		if (finishedTaskName === this.runningRootTask) {
			this.runningRootTask = this.getNextRootTask();

			if (this.runningRootTask) {
				return this.getReadyTasks();
			}

			return new Set<string>();
		}

		this.context.nadle.logger.debug(c.yellow("[Scheduler]"), `Next tasks = ${Array.from(nextReadyTasks).join(",")}`);

		return nextReadyTasks;
	}

	public getOrderedTasks(task?: string): string[] {
		const readyTasks = Array.from(this.getReadyTasks(task));

		for (const readyTask of readyTasks) {
			readyTasks.push(...Array.from(this.getOrderedTasks(readyTask)));
		}

		return readyTasks;
	}
}
