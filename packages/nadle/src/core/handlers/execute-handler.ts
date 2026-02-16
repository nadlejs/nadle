import { BaseHandler } from "./base-handler.js";
import { TaskPool } from "../engine/task-pool.js";
import { Messages } from "../utilities/messages.js";
import { ResolvedTask } from "../interfaces/resolved-task.js";
import { renderTaskSelection } from "../views/tasks-selection.js";

export class ExecuteHandler extends BaseHandler {
	public readonly name = "execute";
	public readonly description = "Executes the specified tasks.";

	public canHandle(): boolean {
		return true;
	}

	public async handle() {
		let chosenTasks = this.context.options.tasks.map(ResolvedTask.getId);

		if (chosenTasks.length === 0) {
			this.context.updateState((state) => ({ ...state, selectingTasks: true }));
			chosenTasks = await renderTaskSelection(
				this.context.taskRegistry.tasks.map(({ id, label, configResolver }) => {
					return { id, label, description: configResolver().description };
				})
			);
			this.context.updateState((state) => ({ ...state, selectingTasks: false }));

			if (chosenTasks.length === 0) {
				this.context.logger.log(Messages.NoTasksFound());

				return;
			}
		}

		const scheduler = this.context.taskScheduler.init(chosenTasks);
		await this.context.eventEmitter.onTasksScheduled(scheduler.scheduledTask.map((taskId) => this.context.taskRegistry.getTaskById(taskId)));

		await new TaskPool(this.context, (taskId) => scheduler.getReadyTasks(taskId)).run();
	}
}
