import c from "tinyrainbow";
import { uniq } from "lodash-es";

import { highlight } from "../utilities/utils.js";
import { Messages } from "../utilities/messages.js";
import { suggest } from "../utilities/suggestion.js";
import { type Logger } from "../interfaces/logger.js";
import { Project } from "../models/project/project.js";
import { RIGHT_ARROW } from "../utilities/constants.js";
import { TaskIdentifier } from "../models/task-identifier.js";

export class TaskInputResolver {
	public constructor(
		private readonly logger: Logger,
		private readonly taskNamesGetter: (workspace: string) => string[]
	) {}

	public resolve(taskInputs: string[], project: Project) {
		const targetWorkspace = project.currentWorkspaceId;
		const fallbackWorkspace = project.currentWorkspaceId === project.rootWorkspace.id ? undefined : project.rootWorkspace.id;
		const workspaces = uniq(
			Project.getAllWorkspaces(project)
				.flatMap((workspace) => [workspace.label, workspace.id])
				.filter(Boolean)
		);

		const resolveTaskPairs: { resolved: string; original: string }[] = [];

		const resolvedTasks = taskInputs.map((task) => {
			const { taskNameInput, workspaceInput } = TaskIdentifier.parser(task);

			let resolvedTask: string;

			if (workspaceInput !== undefined) {
				const suggestedWorkspaceLabelOrId = this.resolveWorkspace(workspaceInput, workspaces);

				const workspace = Project.getWorkspaceByLabelOrId(project, suggestedWorkspaceLabelOrId);
				resolvedTask = this.resolveTask(project, taskNameInput, workspace.id, undefined);
			} else {
				resolvedTask = this.resolveTask(project, taskNameInput, targetWorkspace, fallbackWorkspace);
			}

			if (resolvedTask !== task && TaskIdentifier.parser(resolvedTask).workspaceInput !== targetWorkspace) {
				resolveTaskPairs.push({ original: task, resolved: resolvedTask });
			}

			return resolvedTask;
		});

		if (resolveTaskPairs.length > 0) {
			const maxOriginTaskLength = Math.max(...resolveTaskPairs.map(({ original }) => original?.length ?? 0));
			const message = [
				`Resolved tasks:\n`,
				...resolveTaskPairs.map(
					({ resolved, original }) =>
						`${" ".repeat(4)}${highlight(original?.padEnd(maxOriginTaskLength, " "))}  ${RIGHT_ARROW} ${c.green(c.bold(resolved))}\n`
				)
			].join("");
			this.logger.log(message);
		}

		this.logger.debug(`Resolved tasks: [ ${resolvedTasks.join(", ")} ]`);

		return resolvedTasks;
	}

	private resolveTask(project: Project, taskNameInput: string, targetWorkspaceId: string, fallbackWorkspaceId: string | undefined): string {
		const resolvedTask = suggest(taskNameInput, this.taskNamesGetter(targetWorkspaceId), this.logger);

		if (resolvedTask.result !== undefined) {
			return TaskIdentifier.create(targetWorkspaceId, resolvedTask.result);
		}

		if (fallbackWorkspaceId !== undefined) {
			const fallbackWorkspace = Project.getWorkspaceByLabelOrId(project, fallbackWorkspaceId);

			const resolvedFallbackTask = suggest(taskNameInput, this.taskNamesGetter(fallbackWorkspace.id), this.logger);

			if (resolvedFallbackTask.result !== undefined) {
				return TaskIdentifier.create(fallbackWorkspace.id, resolvedFallbackTask.result);
			}
		}

		this.logger.throw(Messages.UnresolvedTask(taskNameInput, targetWorkspaceId, fallbackWorkspaceId, formatSuggestions(resolvedTask.suggestions)));
	}

	private resolveWorkspace(workspaceInput: string, workspaceLabels: string[]): string {
		const suggestedWorkspace = suggest(workspaceInput, workspaceLabels, this.logger);

		if (suggestedWorkspace.result === undefined) {
			this.logger.throw(Messages.UnresolvedWorkspace(workspaceInput, formatSuggestions(suggestedWorkspace.suggestions)));
		}

		return suggestedWorkspace.result;
	}
}

function formatSuggestions(suggestions: string[]): string {
	if (suggestions.length === 0) {
		return "";
	}

	const formattedSuggestions = suggestions.map(highlight);

	let displayNames;

	if (formattedSuggestions.length === 1) {
		displayNames = formattedSuggestions[0];
	} else if (formattedSuggestions.length === 2) {
		displayNames = `${formattedSuggestions[0]} or ${formattedSuggestions[1]}`;
	} else {
		displayNames = `${formattedSuggestions.slice(0, -1).join(", ")}, or ${formattedSuggestions.at(-1)}`;
	}

	return `Did you mean ${displayNames}?`;
}
