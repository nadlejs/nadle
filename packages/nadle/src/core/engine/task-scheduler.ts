import c from "tinyrainbow";

import { type Nadle } from "../nadle.js";
import { EnsureMap } from "../utilities/ensure-map.js";
import { RIGHT_ARROW } from "../utilities/constants.js";
import { TaskIdentifierResolver } from "../registration/task-identifier-resolver.js";

export class TaskScheduler {
	// Map between a task and the set of tasks that depend on it
	private readonly dependentsGraph = new EnsureMap<string, Set<string>>(() => new Set());

	// Map between a task and the set of tasks that it depends on
	private readonly dependencyGraph = new EnsureMap<string, Set<string>>(() => new Set());

	// Map between a task and the set of tasks that it depends on transitively
	private readonly transitiveDependencyGraph = new EnsureMap<string, Set<string>>(() => new Set());

	// Map between a tasks and its indegree
	private readonly indegree = new EnsureMap<string, number>(() => 0);

	// Set of tasks that are ready to be executed
	private readonly readyTasks = new Set<string>();

	private taskNames: string[] = [];

	// The main task listed in the tasks argument need to be focused on
	private mainTask: string | undefined = undefined;

	private readonly taskIdentifierResolver: TaskIdentifierResolver;

	public constructor(private readonly nadle: Nadle) {
		this.taskIdentifierResolver = new TaskIdentifierResolver(nadle);
	}

	public init(taskNames: string[]): this {
		this.taskNames = taskNames;

		taskNames.forEach((taskName) => this.analyze(taskName));
		taskNames.forEach((taskName) => this.detectCycle(taskName, [taskName]));

		this.nadle.logger.debug({ tag: "Scheduler" }, `transitiveDependencyGraph`, this.transitiveDependencyGraph);
		this.nadle.logger.debug({ tag: "Scheduler" }, `dependencyGraph`, this.dependencyGraph);

		if (!this.nadle.options.parallel) {
			this.mainTask = taskNames[0];
		}

		return this;
	}

	private detectCycle(taskName: string, paths: string[]) {
		for (const dependency of this.dependencyGraph.get(taskName)) {
			const startTaskIndex = paths.indexOf(dependency);

			if (startTaskIndex !== -1) {
				const cyclePath = [...paths.slice(startTaskIndex), dependency].map(c.bold).join(` ${RIGHT_ARROW} `);
				this.nadle.logger.error(`Cycle detected: ${cyclePath}`);
				throw new Error(`Cycle detected: ${cyclePath}`);
			}

			this.detectCycle(dependency, [...paths, dependency]);
		}
	}

	private analyze(taskName: string): void {
		if (this.dependencyGraph.has(taskName)) {
			return;
		}

		const task = this.nadle.registry.getByName(taskName);
		const dependencies = new Set(
			this.taskIdentifierResolver
				.resolveDependentTasks(taskName, task.configResolver().dependsOn ?? [])
				.filter((task) => !this.nadle.options.excludedTasks.includes(task))
		);

		this.dependencyGraph.set(taskName, dependencies);
		this.indegree.set(taskName, dependencies.size);

		this.transitiveDependencyGraph.set(taskName, new Set<string>(dependencies));

		for (const dependency of dependencies) {
			this.dependentsGraph.update(dependency, (oldDependents) => oldDependents.add(taskName));

			this.analyze(dependency);

			this.transitiveDependencyGraph.update(taskName, (current) => {
				this.transitiveDependencyGraph.get(dependency).forEach((d) => current.add(d));

				return current;
			});
		}
	}

	public get scheduledTask(): string[] {
		return Array.from(this.dependencyGraph.keys());
	}

	private getIndegreeEntries() {
		const runningRootTask = this.mainTask;

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
		if (!this.mainTask) {
			return true;
		}

		if (taskName === this.mainTask) {
			return true;
		}

		return this.transitiveDependencyGraph.get(this.mainTask).has(taskName);
	}

	public getReadyTasks(doneTask?: string): Set<string> {
		this.nadle.logger.debug({ tag: "Scheduler" }, `runningRoot = ${this.mainTask}, finishedTaskName = ${doneTask}`);

		if (doneTask === undefined) {
			return this.getInitialReadyTasks();
		}

		const nextReadyTasks = new Set<string>();

		for (const dependentTask of this.dependentsGraph.get(doneTask)) {
			if (this.readyTasks.has(dependentTask)) {
				continue;
			}

			let indegree = this.indegree.get(dependentTask);

			if (indegree === 0) {
				const message = `Incorrect state. Expect ${dependentTask} to have indegree > 0 because it depends on the running task ${doneTask}`;
				this.nadle.logger.error(message);
				throw new Error(message);
			}

			this.indegree.set(dependentTask, --indegree);

			if (indegree === 0 && this.isBelongToRootTaskTree(dependentTask)) {
				nextReadyTasks.add(dependentTask);
				this.readyTasks.add(dependentTask);
			}
		}

		if (doneTask === this.mainTask) {
			const nextMainTask = this.moveToNextMainTask();

			if (!nextMainTask) {
				return new Set<string>();
			}

			return this.getReadyTasks();
		}

		this.nadle.logger.debug({ tag: "Scheduler" }, `Next tasks = ${Array.from(nextReadyTasks).join(",")}`);

		return nextReadyTasks;
	}

	private getInitialReadyTasks() {
		const nextReadyTasks = new Set<string>();

		for (const [taskName, indegree] of this.getIndegreeEntries()) {
			this.nadle.logger.debug({ tag: "Scheduler" }, `taskName = ${taskName}, indegree = ${indegree}`);

			if (indegree === 0 && !this.readyTasks.has(taskName)) {
				nextReadyTasks.add(taskName);
				this.readyTasks.add(taskName);
			}
		}

		this.nadle.logger.debug({ tag: "Scheduler" }, `Next tasks = ${Array.from(nextReadyTasks).join(",")}`);

		return nextReadyTasks;
	}

	private moveToNextMainTask() {
		this.mainTask = this.mainTask !== undefined ? this.taskNames[this.taskNames.indexOf(this.mainTask) + 1] : undefined;

		return this.mainTask;
	}

	public getOrderedTasks(task?: string): string[] {
		const readyTasks = Array.from(this.getReadyTasks(task));

		for (const readyTask of readyTasks) {
			readyTasks.push(...this.getOrderedTasks(readyTask));
		}

		return readyTasks;
	}
}
