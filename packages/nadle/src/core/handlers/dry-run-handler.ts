import c from "tinyrainbow";

import { BaseHandler } from "./base-handler.js";
import { Messages } from "../utilities/messages.js";

export class DryRunHandler extends BaseHandler {
	public readonly name = "dry-run";
	public readonly description = "Prints the execution plan without running tasks.";

	public canHandle(): boolean {
		return this.nadle.options.dryRun;
	}

	public handle() {
		if (this.nadle.resolvedTasks.length === 0) {
			this.nadle.logger.log(Messages.NoTasksFound());

			return;
		}

		const taskIds = this.nadle.taskScheduler.init(this.nadle.resolvedTasks).getOrderedTasks();

		this.nadle.logger.log(c.bold("Execution plan:"));

		for (const taskId of taskIds) {
			this.nadle.logger.log(`${c.yellow(">")} Task ${c.bold(this.nadle.taskRegistry.getById(taskId).label)}`);
		}
	}
}
