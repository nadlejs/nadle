import { getAllWorkspaces } from "@nadle/project-resolver";

import { BaseHandler } from "./base-handler.js";
import { TaskPool } from "../engine/task-pool.js";
import { Messages } from "../utilities/messages.js";
import { ResolvedTask } from "../interfaces/resolved-task.js";
import { renderTaskSelection } from "../views/tasks-selection.js";
import { getChangedFiles, computeAffectedTasks } from "../engine/affected.js";

export class ExecuteHandler extends BaseHandler {
	public readonly name = "execute";
	public readonly description = "Executes the specified tasks.";

	public canHandle(): boolean {
		return true;
	}

	public async handle() {
		let chosenTasks = this.context.options.tasks.map(ResolvedTask.getId);

		if (chosenTasks.length === 0) {
			// The interactive picker needs a TTY for raw-mode stdin. Without one
			// (CI, pipes, exec-based tests) Ink crashes, so fall back to a message.
			if (!process.stdin.isTTY) {
				this.context.logger.log(Messages.NoTasksFound());

				return;
			}

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

		if (this.context.options.since !== undefined && this.context.options.since !== "") {
			chosenTasks = await this.filterAffected(chosenTasks, this.context.options.since);

			if (chosenTasks.length === 0) {
				this.context.logger.log(Messages.NoTasksAffected(this.context.options.since));

				return;
			}
		}

		const { passthroughArgs } = this.context.options;

		if (passthroughArgs.length > 0 && chosenTasks.length > 1) {
			this.context.logger.log(Messages.PassthroughArgsNotice([...passthroughArgs], chosenTasks));
		}

		const scheduler = this.context.taskScheduler.init(chosenTasks);
		await this.context.eventEmitter.onTasksScheduled(scheduler.scheduledTask.map((taskId) => this.context.taskRegistry.getTaskById(taskId)));

		await new TaskPool(this.context, (taskId) => scheduler.getReadyTasks(taskId)).run();
	}

	private async filterAffected(roots: string[], since: string): Promise<string[]> {
		const { project } = this.context.options;
		const scheduler = this.context.taskScheduler.init(roots);

		const changedFiles = await getChangedFiles(since, project.rootWorkspace.absolutePath);

		const workspaceDirs = new Map(getAllWorkspaces(project).map((workspace) => [workspace.id, workspace.absolutePath]));

		return computeAffectedTasks({
			changedFiles,
			workspaceDirs,
			scheduledTasks: scheduler.scheduledTask,
			getTransitiveDependencies: (taskId) => scheduler.getTransitiveDependencies(taskId),
			getWorkspaceId: (taskId) => this.context.taskRegistry.getTaskById(taskId).workspaceId
		});
	}
}
