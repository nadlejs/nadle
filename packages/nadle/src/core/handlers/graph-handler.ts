import { BaseHandler } from "./base-handler.js";
import { Messages } from "../utilities/messages.js";
import { stringify } from "../utilities/stringify.js";
import { ResolvedTask } from "../interfaces/resolved-task.js";
import { type TaskGraph, renderTaskGraph } from "../reporting/task-graph.js";

export class GraphHandler extends BaseHandler {
	public readonly name = "graph";
	public readonly description = "Prints the task dependency graph without running tasks.";

	public canHandle(): boolean {
		return this.context.options.graph !== undefined;
	}

	public handle(): void {
		if (this.context.options.tasks.length === 0) {
			if (this.context.options.json) {
				this.context.logger.log(stringify({ roots: [], nodes: [] }));
			} else {
				this.context.logger.log(Messages.NoTasksFound());
			}

			return;
		}

		const scheduler = this.context.taskScheduler.init();

		const nodes: TaskGraph.Node[] = scheduler.scheduledTask.map((taskId) => ({
			id: taskId,
			implicitDependencies: scheduler.getImplicitDeps(taskId),
			label: this.context.taskRegistry.getTaskById(taskId).label,
			dependencies: [...scheduler.getDirectDependencies(taskId)]
		}));

		const roots = this.context.options.tasks.map(ResolvedTask.getId);

		if (this.context.options.json) {
			this.context.logger.log(stringify({ roots, nodes }));

			return;
		}

		this.context.logger.log(renderTaskGraph({ roots, nodes, format: this.context.options.graph ?? "tree" }));
	}
}
