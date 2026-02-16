import c from "tinyrainbow";
import { groupBy } from "lodash-es";

import { BaseHandler } from "./base-handler.js";
import { DASH } from "../utilities/constants.js";
import { capitalize } from "../utilities/utils.js";
import { combineComparators } from "../utilities/comparator.js";
import { RootWorkspace } from "../models/project/root-workspace.js";
import type { RegisteredTask } from "../interfaces/registered-task.js";

interface DescribedTask extends RegisteredTask {
	readonly description?: string;
}

type Group = [string, DescribedTask[]];

export class ListHandler extends BaseHandler {
	public readonly name = "list";
	public readonly description = "Lists all registered tasks with their groups and descriptions.";

	private static readonly UncategorizedGroup = "Uncategorized";

	public canHandle(): boolean {
		return this.context.options.list;
	}

	public handle() {
		if (this.context.taskRegistry.tasks.length === 0) {
			this.context.logger.log("No tasks found");

			return;
		}

		const groups = this.computeGroups();

		for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
			const [groupName, tasks] = groups[groupIndex];

			const label = `${capitalize(groupName)} tasks`;
			this.context.logger.log(c.bold(label));
			this.context.logger.log(c.bold(DASH.repeat(label.length)));

			for (const task of tasks) {
				const { label, description } = task;

				if (description) {
					this.context.logger.log(c.bold(c.green(label)) + c.yellow(` - ${description}`));
				} else {
					this.context.logger.log(c.green(label));
				}
			}

			if (groupIndex < groups.length - 1) {
				this.context.logger.log("");
			}
		}
	}

	private computeGroups(): Group[] {
		const tasks = this.context.taskRegistry.tasks.map((task) => {
			const { description, group = ListHandler.UncategorizedGroup } = task.configResolver();

			return { ...task, group, description };
		});

		const groupComparator = combineComparators<Group>([
			([a], [b]) => Number(a === ListHandler.UncategorizedGroup) - Number(b === ListHandler.UncategorizedGroup),
			([a], [b]) => a.localeCompare(b)
		]);

		const taskComparator = combineComparators<DescribedTask>([
			(a, b) => Number(RootWorkspace.isRootWorkspaceId(b.workspaceId)) - Number(RootWorkspace.isRootWorkspaceId(a.workspaceId)),
			(a, b) => a.label.localeCompare(b.label)
		]);

		return Object.entries(groupBy(tasks, "group"))
			.sort(groupComparator)
			.map(([groupName, tasks]) => [groupName, tasks.sort(taskComparator)]);
	}
}
