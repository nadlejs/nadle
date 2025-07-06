import c from "tinyrainbow";

import { type Nadle } from "../nadle.js";
import { EnsureMap } from "../utilities/ensure-map.js";
import { RIGHT_ARROW } from "../utilities/constants.js";
import { Project } from "../options/project-resolver.js";
import { type TaskIdentifier } from "../registration/task-identifier.js";

export class TaskScheduler {
	// Map between a task and the set of tasks that depend on it
	private readonly dependentsGraph = new EnsureMap<TaskIdentifier, Set<TaskIdentifier>>(() => new Set());

	// Map between a task and the set of tasks that it depends on
	private readonly dependencyGraph = new EnsureMap<TaskIdentifier, Set<TaskIdentifier>>(() => new Set());

	// Map between a task and the set of tasks that it depends on transitively
	private readonly transitiveDependencyGraph = new EnsureMap<TaskIdentifier, Set<TaskIdentifier>>(() => new Set());

	// Map between a tasks and its indegree
	private readonly indegree = new EnsureMap<TaskIdentifier, number>(() => 0);

	// Set of tasks that are ready to be executed
	private readonly readyTasks = new Set<TaskIdentifier>();

	private taskIds: TaskIdentifier[] = [];

	// The main task listed in the tasks argument need to be focused on
	private mainTaskId: string | undefined = undefined;

	public constructor(private readonly nadle: Nadle) {}

	public init(taskIds: string[]): this {
		this.taskIds = this.expandWorkspaceTasks(taskIds);

		this.taskIds.forEach((taskId) => this.analyze(taskId));
		this.taskIds.forEach((taskId) => this.detectCycle(taskId, [taskId]));

		this.nadle.logger.debug({ tag: "Scheduler" }, `transitiveDependencyGraph`, this.transitiveDependencyGraph);
		this.nadle.logger.debug({ tag: "Scheduler" }, `dependencyGraph`, this.dependencyGraph);

		if (!this.nadle.options.parallel) {
			this.mainTaskId = this.taskIds[0];
		}

		return this;
	}

	private expandWorkspaceTasks(taskIds: string[]): string[] {
		const expandedTaskIds: string[] = [];

		for (const taskId of taskIds) {
			expandedTaskIds.push(taskId);
			const { name, workspaceId } = this.nadle.registry.getById(taskId);

			if (!Project.isRootWorkspace(workspaceId)) {
				continue;
			}

			for (const sameNameTask of this.nadle.registry.getByName(name)) {
				if (!taskIds.includes(sameNameTask.id)) {
					expandedTaskIds.push(sameNameTask.id);
				}
			}
		}

		return expandedTaskIds;
	}

	private detectCycle(taskId: string, paths: string[]) {
		for (const dependency of this.dependencyGraph.get(taskId)) {
			const startTaskIndex = paths.indexOf(dependency);

			if (startTaskIndex !== -1) {
				const cyclePath = [...paths.slice(startTaskIndex), dependency].map(c.bold).join(` ${RIGHT_ARROW} `);
				this.nadle.logger.error(`Cycle detected: ${cyclePath}`);
				throw new Error(`Cycle detected: ${cyclePath}`);
			}

			this.detectCycle(dependency, [...paths, dependency]);
		}
	}

	private analyze(taskId: string): void {
		if (this.dependencyGraph.has(taskId)) {
			return;
		}

		const { workspaceId, configResolver } = this.nadle.registry.getById(taskId);

		const dependencies = new Set(
			(configResolver().dependsOn ?? [])
				.map((dependencyTaskInput) => this.nadle.registry.parse(dependencyTaskInput, workspaceId))
				.filter((taskId) => !this.nadle.excludedTaskIds.includes(taskId))
		);

		this.dependencyGraph.set(taskId, dependencies);
		this.indegree.set(taskId, dependencies.size);

		this.transitiveDependencyGraph.set(taskId, new Set<string>(dependencies));

		for (const dependency of dependencies) {
			this.dependentsGraph.update(dependency, (oldDependents) => oldDependents.add(taskId));

			this.analyze(dependency);

			this.transitiveDependencyGraph.update(taskId, (current) => {
				this.transitiveDependencyGraph.get(dependency).forEach((d) => current.add(d));

				return current;
			});
		}
	}

	public get scheduledTask(): string[] {
		return Array.from(this.dependencyGraph.keys());
	}

	private getIndegreeEntries() {
		const runningRootTaskId = this.mainTaskId;

		if (!runningRootTaskId) {
			return this.indegree.entries();
		}

		return new Map(
			Array.from(this.indegree.entries()).filter(
				([taskId]) => taskId === runningRootTaskId || this.transitiveDependencyGraph.get(runningRootTaskId)?.has(taskId)
			)
		);
	}

	private isBelongToRootTaskTree(taskId: string): boolean {
		if (!this.mainTaskId) {
			return true;
		}

		if (taskId === this.mainTaskId) {
			return true;
		}

		return this.transitiveDependencyGraph.get(this.mainTaskId).has(taskId);
	}

	public getReadyTasks(doneTaskId?: string): Set<string> {
		this.nadle.logger.debug({ tag: "Scheduler" }, `runningRoot = ${this.mainTaskId}, doneTaskId = ${doneTaskId}`);

		if (doneTaskId === undefined) {
			return this.getInitialReadyTasks();
		}

		const nextReadyTasks = new Set<TaskIdentifier>();

		for (const dependentTask of this.dependentsGraph.get(doneTaskId)) {
			if (this.readyTasks.has(dependentTask)) {
				continue;
			}

			let indegree = this.indegree.get(dependentTask);

			if (indegree === 0) {
				const message = `Incorrect state. Expect ${dependentTask} to have indegree > 0 because it depends on the running task ${doneTaskId}`;
				this.nadle.logger.error(message);
				throw new Error(message);
			}

			this.indegree.set(dependentTask, --indegree);

			if (indegree === 0 && this.isBelongToRootTaskTree(dependentTask)) {
				nextReadyTasks.add(dependentTask);
				this.readyTasks.add(dependentTask);
			}
		}

		if (doneTaskId === this.mainTaskId) {
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

		for (const [taskId, indegree] of this.getIndegreeEntries()) {
			this.nadle.logger.debug({ tag: "Scheduler" }, `taskId = ${taskId}, indegree = ${indegree}`);

			if (indegree === 0 && !this.readyTasks.has(taskId)) {
				nextReadyTasks.add(taskId);
				this.readyTasks.add(taskId);
			}
		}

		this.nadle.logger.debug({ tag: "Scheduler" }, `Next tasks = ${Array.from(nextReadyTasks).join(",")}`);

		return nextReadyTasks;
	}

	private moveToNextMainTask() {
		this.mainTaskId = this.mainTaskId !== undefined ? this.taskIds[this.taskIds.indexOf(this.mainTaskId) + 1] : undefined;

		return this.mainTaskId;
	}

	public getOrderedTasks(taskId?: TaskIdentifier): TaskIdentifier[] {
		const readyTaskIds = Array.from(this.getReadyTasks(taskId));

		for (const readyTaskId of readyTaskIds) {
			readyTaskIds.push(...this.getOrderedTasks(readyTaskId));
		}

		return readyTaskIds;
	}
}
