import { highlight } from "../utilities/utils.js";
import { Messages } from "../utilities/messages.js";
import { EnsureMap } from "../utilities/ensure-map.js";
import { RIGHT_ARROW } from "../utilities/constants.js";
import { MaybeArray } from "../utilities/maybe-array.js";
import { ResolvedTask } from "../interfaces/resolved-task.js";
import { type SchedulerDependencies } from "./scheduler-types.js";
import { type TaskIdentifier } from "../models/task-identifier.js";
import { resolveImplicitDependencies } from "./implicit-dependency-resolver.js";

export class TaskScheduler {
	private readonly dependentsGraph = new EnsureMap<TaskIdentifier, Set<TaskIdentifier>>(() => new Set());
	private readonly dependencyGraph = new EnsureMap<TaskIdentifier, Set<TaskIdentifier>>(() => new Set());
	private readonly transitiveDependencyGraph = new EnsureMap<TaskIdentifier, Set<TaskIdentifier>>(() => new Set());
	private readonly indegree = new EnsureMap<TaskIdentifier, number>(() => 0);
	private readonly readyTasks = new Set<TaskIdentifier>();
	private readonly implicitEdges = new Set<string>();
	private readonly rootAggregationDeps = new Map<TaskIdentifier, Set<TaskIdentifier>>();
	private taskIds: TaskIdentifier[] = [];
	private excludedTaskIds = new Set<TaskIdentifier>();
	private mainTaskId: string | undefined = undefined;

	public constructor(private readonly deps: SchedulerDependencies) {}

	public init(taskIds: string[] = this.deps.options.tasks.map(({ taskId }) => taskId)): this {
		this.taskIds = this.expandWorkspaceTasks(taskIds);
		this.excludedTaskIds = new Set(this.deps.options.excludedTasks.map(ResolvedTask.getId));
		this.taskIds.forEach((taskId) => this.analyze(taskId));
		this.taskIds.forEach((taskId) => this.detectCycle(taskId, [taskId]));
		this.deps.logger.debug({ tag: "Scheduler" }, `transitiveDependencyGraph`, this.transitiveDependencyGraph);
		this.deps.logger.debug({ tag: "Scheduler" }, `dependencyGraph`, this.dependencyGraph);

		if (!this.deps.options.parallel) {
			this.mainTaskId = this.taskIds[0];
		}

		return this;
	}

	private expandWorkspaceTasks(taskIds: string[]): string[] {
		const expandedTaskIds: string[] = [];

		for (const taskId of taskIds) {
			expandedTaskIds.push(taskId);
			const { name, workspaceId } = this.deps.getTaskById(taskId);

			if (!this.deps.isRootWorkspace(workspaceId)) {
				continue;
			}

			const childTaskIds = new Set<TaskIdentifier>();

			for (const sameNameTask of this.deps.getTasksByName(name)) {
				if (!taskIds.includes(sameNameTask.id)) {
					expandedTaskIds.push(sameNameTask.id);
					childTaskIds.add(sameNameTask.id);
				}
			}

			if (childTaskIds.size > 0 && this.deps.options.implicitDependencies) {
				this.rootAggregationDeps.set(taskId, childTaskIds);
			}
		}

		return expandedTaskIds;
	}

	private detectCycle(taskId: string, paths: string[]) {
		for (const dependency of this.dependencyGraph.get(taskId)) {
			const startIndex = paths.indexOf(dependency);

			if (startIndex !== -1) {
				const cycle = [...paths.slice(startIndex), dependency].map(highlight).join(` ${RIGHT_ARROW} `);
				this.deps.logger.throw(Messages.CycleDetected(cycle));
			}

			this.detectCycle(dependency, [...paths, dependency]);
		}
	}

	private analyze(taskId: string): void {
		if (this.dependencyGraph.has(taskId)) {
			return;
		}

		const { workspaceId, configResolver } = this.deps.getTaskById(taskId);
		const dependencies = new Set(
			MaybeArray.toArray(configResolver().dependsOn ?? [])
				.map((input) => this.deps.parseTaskRef(input, workspaceId))
				.filter((id) => !this.excludedTaskIds.has(id))
		);

		if (this.deps.options.implicitDependencies) {
			this.addImplicitDeps(taskId, dependencies);
		}

		this.dependencyGraph.set(taskId, dependencies);
		this.indegree.set(taskId, dependencies.size);
		this.transitiveDependencyGraph.set(taskId, new Set<string>(dependencies));

		for (const dependency of dependencies) {
			this.dependentsGraph.update(dependency, (s) => s.add(taskId));
			this.analyze(dependency);
			this.transitiveDependencyGraph.update(taskId, (current) => {
				this.transitiveDependencyGraph.get(dependency).forEach((d) => current.add(d));

				return current;
			});
		}
	}

	private addImplicitDeps(taskId: string, dependencies: Set<string>): void {
		const { name, workspaceId } = this.deps.getTaskById(taskId);

		const resolverDeps = {
			excludedTaskIds: this.excludedTaskIds,
			logger: this.deps.logger,
			getTasksByName: (n: string) => this.deps.getTasksByName(n),
			getWorkspaceDependencies: (id: string) => this.deps.getWorkspaceDependencies(id)
		};

		for (const dep of resolveImplicitDependencies(name, workspaceId, resolverDeps)) {
			if (!dependencies.has(dep)) {
				this.implicitEdges.add(`${dep}->${taskId}`);
			}

			dependencies.add(dep);
		}

		for (const childId of this.rootAggregationDeps.get(taskId) ?? []) {
			if (!this.excludedTaskIds.has(childId)) {
				if (!dependencies.has(childId)) {
					this.implicitEdges.add(`${childId}->${taskId}`);
				}

				dependencies.add(childId);
			}
		}
	}

	public get scheduledTask(): string[] {
		return Array.from(this.dependencyGraph.keys());
	}

	public getImplicitDeps(taskId: TaskIdentifier): TaskIdentifier[] {
		return [...this.dependencyGraph.get(taskId)].filter((dep) => this.implicitEdges.has(`${dep}->${taskId}`));
	}

	private getIndegreeEntries() {
		if (!this.mainTaskId) {
			return this.indegree.entries();
		}

		const rootId = this.mainTaskId;

		return new Map(
			Array.from(this.indegree.entries()).filter(([taskId]) => taskId === rootId || this.transitiveDependencyGraph.get(rootId)?.has(taskId))
		);
	}

	private isBelongToRootTaskTree(taskId: string): boolean {
		if (!this.mainTaskId || taskId === this.mainTaskId) {
			return true;
		}

		return this.transitiveDependencyGraph.get(this.mainTaskId).has(taskId);
	}

	public getReadyTasks(doneTaskId?: string): Set<string> {
		this.deps.logger.debug({ tag: "Scheduler" }, `runningRoot = ${this.mainTaskId}, doneTaskId = ${doneTaskId}`);

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
				throw new Error(`Incorrect state. Expect ${dependentTask} to have indegree > 0`);
			}

			this.indegree.set(dependentTask, --indegree);

			if (indegree === 0 && this.isBelongToRootTaskTree(dependentTask)) {
				nextReadyTasks.add(dependentTask);
				this.readyTasks.add(dependentTask);
			}
		}

		if (doneTaskId === this.mainTaskId) {
			if (!this.moveToNextMainTask()) {
				return new Set<string>();
			}

			return this.getReadyTasks();
		}

		this.deps.logger.debug({ tag: "Scheduler" }, `Next tasks = ${Array.from(nextReadyTasks).join(",")}`);

		return nextReadyTasks;
	}

	private getInitialReadyTasks() {
		const nextReadyTasks = new Set<string>();

		for (const [taskId, indegree] of this.getIndegreeEntries()) {
			this.deps.logger.debug({ tag: "Scheduler" }, `taskId = ${taskId}, indegree = ${indegree}`);

			if (indegree === 0 && !this.readyTasks.has(taskId)) {
				nextReadyTasks.add(taskId);
				this.readyTasks.add(taskId);
			}
		}

		this.deps.logger.debug({ tag: "Scheduler" }, `Next tasks = ${Array.from(nextReadyTasks).join(",")}`);

		return nextReadyTasks;
	}

	private moveToNextMainTask() {
		const nextIndex = this.mainTaskId !== undefined ? this.taskIds.indexOf(this.mainTaskId) + 1 : -1;
		this.mainTaskId = nextIndex >= 0 ? this.taskIds[nextIndex] : undefined;

		return this.mainTaskId;
	}

	public getExecutionPlan(taskId?: TaskIdentifier): TaskIdentifier[] {
		const readyTaskIds = Array.from(this.getReadyTasks(taskId));

		for (const readyTaskId of readyTaskIds) {
			readyTaskIds.push(...this.getExecutionPlan(readyTaskId));
		}

		return readyTaskIds;
	}
}
