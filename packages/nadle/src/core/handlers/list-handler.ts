import c from "tinyrainbow";

import { BaseHandler } from "./base-handler.js";
import { DASH } from "../utilities/constants.js";
import { capitalize } from "../utilities/utils.js";
import type { RegisteredTask } from "../interfaces/registered-task.js";

export class ListHandler extends BaseHandler {
	public readonly name = "list";
	public readonly description = "Lists all registered tasks with their groups and descriptions.";

	private static readonly UncategorizedGroup = "Uncategorized";

	public canHandle(): boolean {
		return this.nadle.options.list;
	}

	public handle() {
		if (this.nadle.taskRegistry.getAll().length === 0) {
			this.nadle.logger.log("No tasks found");

			return;
		}

		const groups = this.computeTaskGroups();

		for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
			const [groupName, tasks] = groups[groupIndex];

			const label = `${capitalize(groupName)} tasks`;
			this.nadle.logger.log(c.bold(label));
			this.nadle.logger.log(c.bold(DASH.repeat(label.length)));

			for (const task of tasks) {
				const { label, description } = task;

				if (description) {
					this.nadle.logger.log(c.bold(c.green(label)) + c.yellow(` - ${description}`));
				} else {
					this.nadle.logger.log(c.green(label));
				}
			}

			if (groupIndex < groups.length - 1) {
				this.nadle.logger.log("");
			}
		}
	}

	private computeTaskGroups(): [string, (RegisteredTask & { description?: string })[]][] {
		const tasksByGroup: Record<string, (RegisteredTask & { description?: string })[]> = {};

		for (const task of this.nadle.taskRegistry.getAll()) {
			const { description, group = ListHandler.UncategorizedGroup } = task.configResolver();

			tasksByGroup[group] ??= [];
			tasksByGroup[group].push({ ...task, description });
		}

		return Object.entries(tasksByGroup)
			.sort(([firstGroupName], [secondGroupName]) => {
				if (firstGroupName === ListHandler.UncategorizedGroup) {
					return 1;
				}

				if (secondGroupName === ListHandler.UncategorizedGroup) {
					return -1;
				}

				return firstGroupName.localeCompare(secondGroupName);
			})
			.map(([groupName, tasks]) => {
				return [groupName, tasks.sort((firstTask, secondTask) => firstTask.id.localeCompare(secondTask.id))];
			});
	}
}
