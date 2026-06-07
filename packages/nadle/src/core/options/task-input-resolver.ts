import { uniq } from "lodash-es";
import micromatch from "micromatch";
import { type Project, getAllWorkspaces, getWorkspaceByLabelOrId } from "@nadle/project-resolver";

import { highlight } from "../utilities/utils.js";
import { Messages } from "../utilities/messages.js";
import { suggest } from "../utilities/suggestion.js";
import { type Logger } from "../interfaces/logger.js";
import { TaskIdentifier } from "../models/task-identifier.js";
import { TaskNotFoundError } from "../utilities/nadle-error.js";
import { type ResolvedTask } from "../interfaces/resolved-task.js";

export class TaskInputResolver {
	public constructor(
		private readonly logger: Logger,
		private readonly taskNamesGetter: (workspace: string) => string[]
	) {}

	public resolve(taskInputs: string[], project: Project): ResolvedTask[] {
		const targetWorkspace = project.currentWorkspaceId;
		const fallbackWorkspace = project.currentWorkspaceId === project.rootWorkspace.id ? undefined : project.rootWorkspace.id;
		const workspaces = uniq(
			getAllWorkspaces(project)
				.flatMap((workspace) => [workspace.label, workspace.id])
				.filter(Boolean)
		);

		return taskInputs.flatMap((taskInput) => {
			const { taskNameInput, workspaceInput } = TaskIdentifier.parser(taskInput);

			if (isGlob(taskNameInput)) {
				const targetWorkspaceId =
					workspaceInput === undefined ? targetWorkspace : getWorkspaceByLabelOrId(project, this.resolveWorkspace(workspaceInput, workspaces)).id;
				const fallbackWorkspaceId = workspaceInput === undefined ? fallbackWorkspace : undefined;

				return this.resolveGlob({ project, taskInput, taskNameInput, targetWorkspaceId, fallbackWorkspaceId });
			}

			let resolvedTask: string;

			if (workspaceInput !== undefined) {
				const suggestedWorkspaceLabelOrId = this.resolveWorkspace(workspaceInput, workspaces);

				const workspace = getWorkspaceByLabelOrId(project, suggestedWorkspaceLabelOrId);
				resolvedTask = this.resolveTask({
					project,
					taskNameInput,
					fallbackWorkspaceId: undefined,
					targetWorkspaceId: workspace.id
				});
			} else {
				resolvedTask = this.resolveTask({
					project,
					taskNameInput,
					targetWorkspaceId: targetWorkspace,
					fallbackWorkspaceId: fallbackWorkspace
				});
			}

			const corrected =
				TaskIdentifier.parser(resolvedTask).taskNameInput !== taskNameInput ||
				(workspaceInput !== undefined && TaskIdentifier.parser(resolvedTask).workspaceInput !== workspaceInput) ||
				(workspaceInput === undefined && TaskIdentifier.parser(resolvedTask).workspaceInput !== targetWorkspace);

			return [{ corrected, rawInput: taskInput, taskId: resolvedTask }];
		});
	}

	private resolveGlob(options: {
		project: Project;
		taskInput: string;
		taskNameInput: string;
		targetWorkspaceId: string;
		fallbackWorkspaceId: string | undefined;
	}): ResolvedTask[] {
		const { project, taskInput, taskNameInput, targetWorkspaceId, fallbackWorkspaceId } = options;

		const matchIn = (workspaceId: string): ResolvedTask[] =>
			micromatch(this.taskNamesGetter(workspaceId), taskNameInput).map((taskName) => ({
				corrected: false,
				rawInput: taskInput,
				taskId: TaskIdentifier.create(workspaceId, taskName)
			}));

		const matches = matchIn(targetWorkspaceId);

		if (matches.length > 0) {
			return matches;
		}

		if (fallbackWorkspaceId !== undefined) {
			const fallbackMatches = matchIn(getWorkspaceByLabelOrId(project, fallbackWorkspaceId).id);

			if (fallbackMatches.length > 0) {
				return fallbackMatches;
			}
		}

		const message = Messages.UnresolvedTaskPattern({ targetWorkspaceId, fallbackWorkspaceId, pattern: taskNameInput });
		this.logger.error(message);
		throw new TaskNotFoundError(message);
	}

	private resolveTask(options: {
		project: Project;
		taskNameInput: string;
		targetWorkspaceId: string;
		fallbackWorkspaceId: string | undefined;
	}): string {
		const { project, taskNameInput, targetWorkspaceId, fallbackWorkspaceId } = options;
		const resolvedTask = suggest(taskNameInput, this.taskNamesGetter(targetWorkspaceId), this.logger);

		if (resolvedTask.result !== undefined) {
			return TaskIdentifier.create(targetWorkspaceId, resolvedTask.result);
		}

		if (fallbackWorkspaceId !== undefined) {
			const fallbackWorkspace = getWorkspaceByLabelOrId(project, fallbackWorkspaceId);

			const resolvedFallbackTask = suggest(taskNameInput, this.taskNamesGetter(fallbackWorkspace.id), this.logger);

			if (resolvedFallbackTask.result !== undefined) {
				return TaskIdentifier.create(fallbackWorkspace.id, resolvedFallbackTask.result);
			}
		}

		const message = Messages.UnresolvedTaskWithSuggestions({
			taskNameInput,
			targetWorkspaceId,
			fallbackWorkspaceId,
			suggestions: formatSuggestions(resolvedTask.suggestions)
		});
		this.logger.error(message);
		throw new TaskNotFoundError(message);
	}

	private resolveWorkspace(workspaceInput: string, workspaceLabels: string[]): string {
		const suggestedWorkspace = suggest(workspaceInput, workspaceLabels, this.logger);

		if (suggestedWorkspace.result === undefined) {
			const message = Messages.UnresolvedWorkspace(workspaceInput, formatSuggestions(suggestedWorkspace.suggestions));
			this.logger.error(message);
			throw new TaskNotFoundError(message);
		}

		return suggestedWorkspace.result;
	}
}

function isGlob(taskNameInput: string): boolean {
	return /[*?[\]{}!]/.test(taskNameInput);
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
