import { ROOT_WORKSPACE_ID } from "@nadle/project-resolver";

import { BaseHandler } from "./base-handler.js";
import { stringify } from "../utilities/stringify.js";
import { type TaskScheduler } from "../engine/task-scheduler.js";
import { formatDeclarations } from "../utilities/declarations.js";
import { type TaskExplanation, renderTaskExplanation } from "../reporting/task-explanation.js";

export class ExplainHandler extends BaseHandler {
	public readonly name = "explain";
	public readonly description = "Explains why a task runs, what depends on it, and its inputs, without running it.";

	public canHandle(): boolean {
		return this.context.options.explain !== undefined;
	}

	public handle(): void {
		const input = this.context.options.explain;

		if (input === undefined || input === "") {
			this.context.logger.error("`--explain` needs a task name, e.g. `nadle --explain build`.");

			return;
		}

		const taskId = this.context.taskRegistry.parse(input, ROOT_WORKSPACE_ID);

		// Seed the scheduler with the requested tasks when present, otherwise the whole
		// task set, so the target and its relations always exist in the analyzed graph.
		const requestedRoots = this.context.options.tasks.map(({ taskId: id }) => id);
		const seed = requestedRoots.length > 0 ? requestedRoots : this.context.taskRegistry.tasks.map((task) => task.id);
		const scheduler = this.context.taskScheduler.init(seed);

		const task = this.context.taskRegistry.getTaskById(taskId);
		const config = task.configResolver();

		const explanation: TaskExplanation.Props = {
			label: task.label,
			inputs: formatDeclarations(config.inputs),
			cachingEnabled: this.context.options.cache,
			requestedDirectly: requestedRoots.includes(taskId),
			dependents: this.collectDependents(scheduler, taskId),
			pullPaths: this.collectPullPaths(scheduler, requestedRoots, taskId)
		};

		if (this.context.options.json) {
			this.context.logger.log(stringify(explanation));

			return;
		}

		this.context.logger.log(renderTaskExplanation(explanation));
	}

	private collectDependents(scheduler: TaskScheduler, taskId: string): string[] {
		return scheduler.scheduledTask
			.filter((id) => scheduler.getDirectDependencies(id).has(taskId))
			.map((id) => this.context.taskRegistry.getTaskById(id).label);
	}

	private collectPullPaths(scheduler: TaskScheduler, roots: readonly string[], target: string): string[][] {
		const paths: string[][] = [];

		const walk = (id: string, trail: string[]): void => {
			const nextTrail = [...trail, id];

			if (id === target && trail.length > 0) {
				paths.push(nextTrail.map((stepId) => this.context.taskRegistry.getTaskById(stepId).label));

				return;
			}

			for (const dep of scheduler.getDirectDependencies(id)) {
				walk(dep, nextTrail);
			}
		};

		for (const root of roots) {
			if (root !== target) {
				walk(root, []);
			}
		}

		return paths;
	}
}
