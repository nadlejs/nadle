import { BaseHandler } from "./base-handler.js";
import { TaskPool } from "../engine/task-pool.js";
import { Messages } from "../utilities/messages.js";
import { renderTaskSelection } from "../views/tasks-selection.js";

export class ExecuteHandler extends BaseHandler {
	public readonly name = "execute";
	public readonly description = "Executes the specified tasks.";

	public canHandle(): boolean {
		return true;
	}

	public async handle() {
		let chosenTasks = this.nadle.options.tasks;

		if (chosenTasks.length === 0) {
			chosenTasks = await renderTaskSelection(this.nadle.taskRegistry);

			if (chosenTasks.length === 0) {
				this.nadle.logger.log(Messages.NoTasksFound());

				return;
			}
		}

		const scheduler = this.nadle.taskScheduler.init(chosenTasks);
		await this.nadle.eventEmitter.onTasksScheduled(scheduler.scheduledTask.map((taskId) => this.nadle.taskRegistry.getTaskById(taskId)));

		await new TaskPool(this.nadle, (taskId) => scheduler.getReadyTasks(taskId)).run();
	}
}
