import c from "tinyrainbow";

import { BaseHandler } from "./base-handler.js";
import { Messages } from "../utilities/messages.js";
import { stringify } from "../utilities/stringify.js";
import { ResolvedTask } from "../interfaces/resolved-task.js";

export class DryRunHandler extends BaseHandler {
	public readonly name = "dry-run";
	public readonly description = "Prints the execution plan without running tasks.";

	public canHandle(): boolean {
		return this.context.options.dryRun;
	}

	public handle() {
		if (this.context.options.json) {
			this.context.logger.log(stringify(this.toJson()));

			return;
		}

		if (this.context.options.tasks.length === 0) {
			this.context.logger.log(Messages.NoTasksFound());

			return;
		}

		const scheduler = this.context.taskScheduler.init();
		const taskIds = scheduler.getExecutionPlan();

		this.context.logger.log(c.bold("Execution plan:"));

		const { passthroughArgs } = this.context.options;
		const requestedTaskIds = new Set(this.context.options.tasks.map(ResolvedTask.getId));

		for (const taskId of taskIds) {
			const label = this.context.taskRegistry.getTaskById(taskId).label;
			const implicitDeps = scheduler.getImplicitDeps(taskId);
			const argsSuffix = passthroughArgs.length > 0 && requestedTaskIds.has(taskId) ? c.dim(` (args: ${passthroughArgs.join(" ")})`) : "";
			const suffix =
				implicitDeps.length > 0
					? c.dim(` (after ${implicitDeps.map((d) => this.context.taskRegistry.getTaskById(d).label).join(", ")} — implicit)`)
					: "";
			this.context.logger.log(`${c.yellow(">")} Task ${c.bold(label)}${argsSuffix}${suffix}`);
		}
	}

	private toJson() {
		if (this.context.options.tasks.length === 0) {
			return { plan: [] };
		}

		const scheduler = this.context.taskScheduler.init();
		const { passthroughArgs } = this.context.options;
		const requestedTaskIds = new Set(this.context.options.tasks.map(ResolvedTask.getId));

		const plan = scheduler.getExecutionPlan().map((taskId) => ({
			id: taskId,
			implicitDependencies: scheduler.getImplicitDeps(taskId),
			args: requestedTaskIds.has(taskId) ? passthroughArgs : [],
			label: this.context.taskRegistry.getTaskById(taskId).label
		}));

		return { plan };
	}
}
