import c from "tinyrainbow";

import { BaseHandler } from "./base-handler.js";
import { Messages } from "../utilities/messages.js";

export class DryRunHandler extends BaseHandler {
	public readonly name = "dry-run";
	public readonly description = "Prints the execution plan without running tasks.";

	public canHandle(): boolean {
		return this.context.options.dryRun;
	}

	public handle() {
		if (this.context.options.tasks.length === 0) {
			this.context.logger.log(Messages.NoTasksFound());

			return;
		}

		const scheduler = this.context.taskScheduler.init();
		const taskIds = scheduler.getExecutionPlan();

		this.context.logger.log(c.bold("Execution plan:"));

		for (const taskId of taskIds) {
			const label = this.context.taskRegistry.getTaskById(taskId).label;
			const implicitDeps = scheduler.getImplicitDeps(taskId);
			const suffix =
				implicitDeps.length > 0
					? c.dim(` (after ${implicitDeps.map((d) => this.context.taskRegistry.getTaskById(d).label).join(", ")} — implicit)`)
					: "";
			this.context.logger.log(`${c.yellow(">")} Task ${c.bold(label)}${suffix}`);
		}
	}
}
