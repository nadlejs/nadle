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

		const taskIds = this.context.taskScheduler.init().getExecutionPlan();

		this.context.logger.log(c.bold("Execution plan:"));

		for (const taskId of taskIds) {
			this.context.logger.log(`${c.yellow(">")} Task ${c.bold(this.context.taskRegistry.getTaskById(taskId).label)}`);
		}
	}
}
